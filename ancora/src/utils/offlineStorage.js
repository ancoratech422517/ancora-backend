const DATABASE_NAME = "ancora-offline";
const DATABASE_VERSION = 2;
const OUTBOX_STORE = "outbox";
const CHAT_STORE = "chat-history";

let databasePromise;

function openDatabase() {
  if (!("indexedDB" in globalThis)) {
    return Promise.reject(new Error("O armazenamento offline não está disponível neste dispositivo."));
  }
  if (databasePromise) return databasePromise;

  databasePromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);
    request.onupgradeneeded = (event) => {
      const database = request.result;
      if (!database.objectStoreNames.contains(OUTBOX_STORE)) {
        database.createObjectStore(OUTBOX_STORE, { keyPath: "id" });
      }
      if (!database.objectStoreNames.contains(CHAT_STORE)) {
        database.createObjectStore(CHAT_STORE, { keyPath: "key" });
      }
      const transaction = request.transaction;
      const chatStore = transaction.objectStore(CHAT_STORE);
      if (!chatStore.indexNames.contains("roomKey")) {
        chatStore.createIndex("roomKey", "roomKey", { unique: false });
      }
      if (event.oldVersion > 0 && event.oldVersion < 2) {
        const legacyRows = [];
        const cursorRequest = chatStore.openCursor();
        cursorRequest.onsuccess = () => {
          const cursor = cursorRequest.result;
          if (cursor) {
            if (Array.isArray(cursor.value.messages) && !cursor.value.roomKey) {
              legacyRows.push(cursor.value);
            }
            cursor.continue();
            return;
          }
          legacyRows.forEach((legacyRow) => {
            const roomKey = `${legacyRow.userId}:${legacyRow.roomId}`;
            chatStore.delete(legacyRow.key);
            legacyRow.messages.forEach((message, index) => {
              const identity = message.client_message_id || message.id || `position-${index}`;
              chatStore.put({
                key: `${roomKey}:${encodeURIComponent(identity)}`,
                roomKey,
                userId: legacyRow.userId,
                roomId: legacyRow.roomId,
                order: index,
                message,
              });
            });
          });
        };
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => {
      databasePromise = null;
      reject(request.error || new Error("Não foi possível abrir o armazenamento offline."));
    };
    request.onblocked = () => {
      databasePromise = null;
      reject(new Error("O armazenamento offline está ocupado noutra janela da Âncora."));
    };
  });
  return databasePromise;
}

async function runTransaction(storeName, mode, action) {
  const database = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(storeName, mode);
    const store = transaction.objectStore(storeName);
    let result;
    try {
      result = action(store);
    } catch (error) {
      reject(error);
      return;
    }
    transaction.oncomplete = () => resolve(result?.result);
    transaction.onerror = () => reject(transaction.error || new Error("Falha no armazenamento offline."));
    transaction.onabort = () => reject(transaction.error || new Error("A gravação offline foi cancelada."));
  });
}

export function notifyOfflineStorageChanged() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("ancora:offline-storage-change"));
  }
}

export async function saveChatHistory(userId, roomId, messages) {
  if (userId == null || !roomId || !Array.isArray(messages)) {
    throw new Error("Não foi possível guardar o histórico: faltam dados da conversa.");
  }
  const roomKey = `${userId}:${roomId}`;
  const database = await openDatabase();
  await new Promise((resolve, reject) => {
    const transaction = database.transaction(CHAT_STORE, "readwrite");
    const store = transaction.objectStore(CHAT_STORE);
    const request = store.index("roomKey").getAll(roomKey);
    request.onsuccess = () => {
      request.result.forEach((entry) => store.delete(entry.key));
      store.delete(roomKey);
      messages.forEach((message, index) => {
        const identity = message.client_message_id || message.id || `position-${index}`;
        store.put({
          key: `${roomKey}:${encodeURIComponent(identity)}`,
          roomKey,
          userId: String(userId),
          roomId: String(roomId),
          order: index,
          message,
          savedAt: Date.now(),
        });
      });
    };
    transaction.oncomplete = resolve;
    transaction.onerror = () => reject(transaction.error || new Error("Falha ao guardar o histórico local."));
    transaction.onabort = () => reject(transaction.error || new Error("A gravação do histórico foi cancelada."));
  });
}

export async function saveChatMessage(userId, roomId, message, position = 0) {
  if (userId == null || !roomId || !message) {
    throw new Error("Não foi possível guardar a mensagem localmente.");
  }
  const roomKey = `${userId}:${roomId}`;
  const identity = message.client_message_id || message.id || `position-${position}`;
  const key = `${roomKey}:${encodeURIComponent(identity)}`;
  const database = await openDatabase();
  await new Promise((resolve, reject) => {
    const transaction = database.transaction(CHAT_STORE, "readwrite");
    const store = transaction.objectStore(CHAT_STORE);
    const request = store.get(key);
    request.onsuccess = () => store.put({
      key,
      roomKey,
      userId: String(userId),
      roomId: String(roomId),
      order: request.result?.order ?? position,
      message,
      savedAt: Date.now(),
    });
    transaction.oncomplete = resolve;
    transaction.onerror = () => reject(transaction.error || new Error("Falha ao guardar a mensagem local."));
    transaction.onabort = () => reject(transaction.error || new Error("A gravação da mensagem foi cancelada."));
  });
}

export async function loadChatHistory(userId, roomId) {
  if (userId == null || !roomId) return [];
  const roomKey = `${userId}:${roomId}`;
  const entries = await runTransaction(CHAT_STORE, "readonly", (store) =>
    store.index("roomKey").getAll(roomKey)
  );
  return (entries || [])
    .sort((left, right) => left.order - right.order)
    .map((entry) => entry.message);
}

export async function putOutboxEntry(entry) {
  await runTransaction(OUTBOX_STORE, "readwrite", (store) => store.put(entry));
  notifyOfflineStorageChanged();
  return entry;
}

export async function getOutboxEntries(userId) {
  const entries = await runTransaction(OUTBOX_STORE, "readonly", (store) => store.getAll());
  return (entries || [])
    .filter((entry) => userId == null || String(entry.userId) === String(userId))
    .sort((left, right) => left.createdAt - right.createdAt);
}

export async function deleteOutboxEntry(id) {
  await runTransaction(OUTBOX_STORE, "readwrite", (store) => store.delete(id));
  notifyOfflineStorageChanged();
}

export async function updateOutboxEntry(id, updates) {
  const database = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(OUTBOX_STORE, "readwrite");
    const store = transaction.objectStore(OUTBOX_STORE);
    const request = store.get(id);
    request.onsuccess = () => {
      if (!request.result) return;
      store.put({ ...request.result, ...updates });
    };
    transaction.oncomplete = () => {
      notifyOfflineStorageChanged();
      resolve();
    };
    transaction.onerror = () => reject(transaction.error || new Error("Falha ao atualizar a fila offline."));
    transaction.onabort = () => reject(transaction.error || new Error("A atualização da fila offline foi cancelada."));
  });
}

export async function claimOutboxEntry(id, userId) {
  const database = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(OUTBOX_STORE, "readwrite");
    const store = transaction.objectStore(OUTBOX_STORE);
    const request = store.get(id);
    let claimed = false;
    request.onsuccess = () => {
      const entry = request.result;
      if (!entry || String(entry.userId) !== String(userId) || entry.status !== "pending") return;
      store.put({
        ...entry,
        status: "sending",
        attempts: (entry.attempts || 0) + 1,
        leaseUntil: Date.now() + 120000,
      });
      claimed = true;
    };
    transaction.oncomplete = () => {
      if (claimed) notifyOfflineStorageChanged();
      resolve(claimed);
    };
    transaction.onerror = () => reject(transaction.error || new Error("Falha ao reservar a ação da fila."));
    transaction.onabort = () => reject(transaction.error || new Error("A reserva da ação foi cancelada."));
  });
}
