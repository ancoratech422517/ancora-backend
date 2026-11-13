import { useUserStore } from "../useUseSotore";
import {
  deleteOutboxEntry,
  claimOutboxEntry,
  getOutboxEntries,
  loadChatHistory,
  putOutboxEntry,
  saveChatHistory,
  updateOutboxEntry,
} from "../utils/offlineStorage";
import { createOfflineId } from "../utils/offlineOutbox";
import { uploadChatFileInChunks } from "../utils/chatFileUpload";

let processing = false;
let listenersStarted = false;

function messageTime() {
  return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export async function queueChatMessage(payload, attachment = null) {
  const { dadosUsuario } = useUserStore.getState();
  if (!dadosUsuario?.id || !payload?.nossa_sala || !payload?.menssagem) {
    throw new Error("Não foi possível guardar a mensagem: faltam dados da conversa.");
  }
  const clientMessageId = createOfflineId();
  const messagePayload = { ...payload, client_message_id: clientMessageId };
  const record = {
    id: clientMessageId,
    type: "chat-message",
    userId: String(dadosUsuario.id),
    payload: messagePayload,
    attachment: attachment ? {
      blob: attachment.file,
      filename: attachment.file.name || attachment.filename,
      mimeType: attachment.file.type || attachment.mimeType || "application/octet-stream",
      size: attachment.file.size,
      blurHash: attachment.blurHash || null,
    } : null,
    status: "pending",
    attempts: 0,
    createdAt: Date.now(),
  };
  await putOutboxEntry(record);
  useUserStore.getState().setMenssagem({
    id: `pending:${clientMessageId}`,
    client_message_id: clientMessageId,
    nossa_sala: payload.nossa_sala,
    id_remitente: dadosUsuario.id,
    id_destinatario: payload.id_amigo,
    nome_remitente: dadosUsuario.nome || "Você",
    nome_destinatario: payload.nome_amigo,
    menssagem: payload.menssagem,
    reply_to_id: payload.reply_to?.id,
    reply_to_menssagem: payload.reply_to?.menssagem,
    reply_to_nome: payload.reply_to?.nome_remitente,
    data_envio: messageTime(),
    lida: false,
    pending: true,
    deliveryState: "pending",
    blobUrl: attachment?.file ? URL.createObjectURL(attachment.file) : null,
  });
  void syncQueuedChatMessages();
  return clientMessageId;
}

export async function queueChatMessageDeletion(payload) {
  const { dadosUsuario, menssagens, elimiar_menssagem_array } = useUserStore.getState();
  if (!dadosUsuario?.id || !payload?.id_menssagem || !payload?.sala_menssagem) {
    throw new Error("Não foi possível guardar a exclusão da mensagem.");
  }
  const localMessage = menssagens.find((message) =>
    String(message.id) === String(payload.id_menssagem)
    && String(message.nossa_sala) === String(payload.sala_menssagem)
  );
  if (String(payload.id_menssagem).startsWith("pending:")) {
    const pendingId = String(payload.id_menssagem).slice("pending:".length);
    await deleteOutboxEntry(pendingId);
  } else {
    await putOutboxEntry({
      id: createOfflineId(),
      type: "chat-delete-message",
      userId: String(dadosUsuario.id),
      payload,
      snapshot: localMessage || null,
      status: "pending",
      attempts: 0,
      createdAt: Date.now(),
    });
  }
  elimiar_menssagem_array(payload.id_menssagem, payload.sala_menssagem);
  void syncQueuedChatMessages();
}

export async function queueSocketEvent(eventName, payload) {
  const userId = useUserStore.getState().dadosUsuario?.id;
  if (!userId || !eventName || !payload) {
    throw new Error("Não foi possível guardar esta ação para sincronização.");
  }
  await putOutboxEntry({
    id: createOfflineId(),
    type: "socket-event",
    eventName,
    userId: String(userId),
    payload,
    status: "pending",
    attempts: 0,
    createdAt: Date.now(),
  });
  void syncQueuedChatMessages();
}

export async function confirmQueuedChatMessage(message) {
  const clientMessageId = message?.client_message_id;
  if (!clientMessageId) return;
  const { dadosUsuario, confirmarMenssagemPendente } = useUserStore.getState();
  if (!dadosUsuario?.id) return;
  const entries = await getOutboxEntries(dadosUsuario.id);
  const entry = entries.find((item) => item.type === "chat-message" && item.id === clientMessageId);
  if (!entry) return;

  confirmarMenssagemPendente(clientMessageId, message.id, message);
  const cached = await loadChatHistory(dadosUsuario.id, entry.payload.nossa_sala);
  const updated = cached.map((item) => (
    String(item.client_message_id) === String(clientMessageId)
      ? { ...item, ...message, pending: false, deliveryState: "sent" }
      : item
  ));
  if (updated.length) {
    try {
      await saveChatHistory(dadosUsuario.id, entry.payload.nossa_sala, updated);
    } catch (error) {
      console.error("A mensagem foi entregue, mas o histórico local não pôde ser atualizado:", error);
    }
  }
  await deleteOutboxEntry(entry.id);
}

export async function syncQueuedChatMessages() {
  if (processing || !navigator.onLine) return;
  const { dadosUsuario, socket } = useUserStore.getState();
  if (!dadosUsuario?.id || !socket?.connected) return;
  processing = true;
  try {
    const entries = await getOutboxEntries(dadosUsuario.id);
    for (const entry of entries) {
      if (!["chat-message", "chat-delete-message", "socket-event"].includes(entry.type) || entry.status === "failed") continue;
      if (entry.status === "sending") {
        if (entry.leaseUntil > Date.now()) continue;
        await updateOutboxEntry(entry.id, { status: "pending" });
      }
      const current = useUserStore.getState();
      if (
        !navigator.onLine
        || String(current.dadosUsuario?.id) !== String(dadosUsuario.id)
        || current.socket !== socket
        || !socket.connected
      ) break;

      if (!await claimOutboxEntry(entry.id, dadosUsuario.id)) continue;
      try {
        let payload = entry.payload;
        if (entry.type === "chat-message" && entry.attachment) {
          const file = new File(
            [entry.attachment.blob],
            entry.attachment.filename,
            { type: entry.attachment.mimeType }
          );
          const upload = await uploadChatFileInChunks(file, {
            backendUrl: current.urlBancoDeDados,
          });
          let filePayload = {};
          try {
            filePayload = JSON.parse(payload.menssagem) || {};
          } catch {
            filePayload = {};
          }
          payload = {
            ...payload,
            menssagem: JSON.stringify({
              ...filePayload,
              isFile: true,
              mimeType: upload.mime_type,
              fileName: upload.filename,
              fileSize: upload.size,
              fileUrl: upload.file_url,
              publicId: upload.public_id,
              folder: upload.folder,
              format: upload.format,
              resourceType: upload.resource_type,
              blurHash: entry.attachment.blurHash,
            }),
          };
          await updateOutboxEntry(entry.id, { payload, attachment: null, status: "sending" });
        }

        const eventName = entry.type === "chat-message"
          ? "enviar_menssagem_na_sala"
          : entry.type === "chat-delete-message"
            ? "Eliminar_menssagem"
            : entry.eventName;
        const result = await new Promise((resolve) => {
          socket.timeout(15000).emit(eventName, payload, (error, response) => {
            if (error) resolve({ timeout: true });
            else resolve(response || { success: false, error: "O servidor não confirmou a mensagem." });
          });
        });

        if (result?.success && entry.type === "chat-message") {
          const confirmedMessage = {
            ...payload,
            id: result.mensagem_id,
            client_message_id: entry.id,
            data_envio: messageTime(),
            lida: false,
            pending: false,
            deliveryState: "sent",
          };
          await confirmQueuedChatMessage(confirmedMessage);
          useUserStore.getState().atualizarUltimaMensagemChat(
            payload.nossa_sala,
            payload.menssagem,
            confirmedMessage.data_envio,
            payload.id_remitente,
            false
          );
          socket.emit("nova_quantidade_de_menssagem", payload);
        } else if (result?.success) {
          await deleteOutboxEntry(entry.id);
        } else if (result?.timeout || !navigator.onLine || !socket.connected) {
          await updateOutboxEntry(entry.id, { status: "pending", lastError: result?.error || "Sem ligação" });
          break;
        } else {
          await updateOutboxEntry(entry.id, {
            status: "failed",
            lastError: result?.error || "O servidor recusou a mensagem.",
          });
          if (entry.type === "chat-delete-message" && entry.snapshot) {
            useUserStore.getState().setMenssagem(entry.snapshot);
          } else {
            useUserStore.getState().confirmarMenssagemPendente(
              entry.id,
              `pending:${entry.id}`,
              { deliveryState: "failed", pending: false }
            );
          }
        }
      } catch (error) {
        const retryable = !navigator.onLine || error instanceof TypeError;
        await updateOutboxEntry(entry.id, {
          status: retryable ? "pending" : "failed",
          lastError: error.message,
        });
        if (!retryable) {
          if (entry.type === "chat-delete-message" && entry.snapshot) {
            useUserStore.getState().setMenssagem(entry.snapshot);
          }
          useUserStore.getState().confirmarMenssagemPendente(
            entry.id,
            `pending:${entry.id}`,
            { deliveryState: "failed", pending: false }
          );
        }
        break;
      }
    }
  } catch (error) {
    console.error("Falha ao sincronizar mensagens offline:", error);
  } finally {
    processing = false;
  }
}

export function startChatOutboxSync() {
  if (listenersStarted || typeof window === "undefined") return;
  listenersStarted = true;
  const sync = () => void syncQueuedChatMessages();
  window.addEventListener("online", sync);
  window.setInterval(sync, 10000);
  let activeSocket;
  let onConnect;
  useUserStore.subscribe((state, previousState) => {
    if (state.socket !== previousState.socket) {
      if (activeSocket && onConnect) activeSocket.off("connect", onConnect);
      activeSocket = state.socket;
      onConnect = sync;
      activeSocket?.on("connect", onConnect);
      sync();
    }
    if (state.dadosUsuario?.id !== previousState.dadosUsuario?.id) sync();
  });
  sync();
}
