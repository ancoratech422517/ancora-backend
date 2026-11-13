import {
  deleteOutboxEntry,
  claimOutboxEntry,
  getOutboxEntries,
  notifyOfflineStorageChanged,
  putOutboxEntry,
  updateOutboxEntry,
} from "./offlineStorage";
import { useUserStore } from "../useUseSotore";

export class OfflineQueuedError extends Error {
  constructor(queueId) {
    super("A ação foi guardada e será sincronizada quando houver ligação.");
    this.name = "OfflineQueuedError";
    this.queued = true;
    this.queueId = queueId;
  }
}

export function createOfflineId() {
  return globalThis.crypto?.randomUUID?.()
    || `offline-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function isExcludedMutation(url) {
  const path = new URL(url, globalThis.location?.origin || "http://localhost").pathname.toLowerCase();
  return /(?:^|\/)(?:auth|login|logout|refresh|register|registrar|livekit|call-token)(?:\/|$)/i.test(path)
    || /(?:checkout|pay|pag|compr|purchase|order|pedido|transfer|transf|transac|deposit|levant|withdraw|sacar|saque|encomenda|finance|fatur)/i.test(path);
}

export function isQueueableMutation(url, method) {
  return ["POST", "PUT", "PATCH", "DELETE"].includes(method.toUpperCase())
    && !isExcludedMutation(url);
}

async function serializeBody(body) {
  if (body == null) return null;
  if (typeof body === "string") return { type: "text", value: body };
  if (typeof FormData !== "undefined" && body instanceof FormData) {
    return {
      type: "form-data",
      entries: Array.from(body.entries(), ([name, value]) => ({
        name,
        value: typeof value === "string" ? { type: "text", value } : {
          type: "blob",
          value,
          filename: value.name || "arquivo",
        },
      })),
    };
  }
  if (body instanceof Blob) return { type: "blob", value: body };
  if (body instanceof URLSearchParams) return { type: "text", value: body.toString() };
  throw new Error("Esta operação não pode ser guardada para envio offline.");
}

export async function enqueueRequest({ url, method, headers, body }) {
  const userId = useUserStore.getState().dadosUsuario?.id;
  if (userId == null) {
    throw new Error("Inicia sessão para guardar esta ação para sincronização.");
  }
  const id = createOfflineId();
  const serializedBody = await serializeBody(body);
  const record = {
    id,
    type: "http-request",
    userId: String(userId),
    url,
    method: method.toUpperCase(),
    headers: Array.from(new Headers(headers || {}).entries()),
    body: serializedBody,
    status: "pending",
    attempts: 0,
    createdAt: Date.now(),
  };
  await putOutboxEntry(record);
  return id;
}

function restoreBody(serialized) {
  if (!serialized) return undefined;
  if (serialized.type === "text" || serialized.type === "blob") return serialized.value;
  if (serialized.type === "form-data") {
    const formData = new FormData();
    serialized.entries.forEach(({ name, value }) => {
      if (value.type === "blob") formData.append(name, value.value, value.filename);
      else formData.append(name, value.value);
    });
    return formData;
  }
  throw new Error("O formato desta ação guardada não é suportado.");
}

function getQueuedUploadIds(serializedBody) {
  const parts = [];
  const collect = (body) => {
    if (!body) return;
    if (body.type === "text") parts.push(body.value);
    if (body.type === "form-data") {
      body.entries.forEach((entry) => {
        if (entry.value.type === "text") parts.push(entry.value.value);
      });
    }
  };
  collect(serializedBody);
  return Array.from(new Set(parts.flatMap((part) =>
    Array.from(part.matchAll(/queued-upload:([\w-]+)/g), (match) => match[1])
  )));
}

async function replaceQueuedUploadReference(userId, uploadId, fileUrl) {
  const marker = `queued-upload:${uploadId}`;
  const entries = await getOutboxEntries(userId);
  for (const entry of entries) {
    if (entry.type !== "http-request" || !entry.body) continue;
    if (!JSON.stringify(entry.body).includes(marker)) continue;
    let updatedBody = entry.body;
    if (updatedBody.type === "text") {
      updatedBody = { ...updatedBody, value: updatedBody.value.split(marker).join(fileUrl) };
    } else if (updatedBody.type === "form-data") {
      updatedBody = {
        ...updatedBody,
        entries: updatedBody.entries.map((formEntry) => (
          formEntry.value.type === "text"
            ? {
                ...formEntry,
                value: {
                  ...formEntry.value,
                  value: formEntry.value.value.split(marker).join(fileUrl),
                },
              }
            : formEntry
        )),
      };
    }
    await updateOutboxEntry(entry.id, { body: updatedBody });
  }
}

let replaying = false;
let removeListeners;

export async function syncRequestOutbox(fetchWithAuth) {
  if (replaying || !navigator.onLine) return;
  const userId = useUserStore.getState().dadosUsuario?.id;
  if (userId == null) return;
  replaying = true;
  let resolvedUpload = false;
  try {
    const entries = await getOutboxEntries(userId);
    for (const entry of entries) {
      if (entry.type !== "http-request" || entry.status === "failed") continue;
      if (entry.status === "sending") {
        if (entry.leaseUntil > Date.now()) continue;
        await updateOutboxEntry(entry.id, {
          status: "failed",
          lastError: "O envio foi interrompido. Confirma o registo no sistema antes de tentar novamente.",
        });
        continue;
      }
      const uploadDependencies = getQueuedUploadIds(entry.body);
      if (uploadDependencies.length) {
        const unresolvedDependencies = uploadDependencies.filter((id) =>
          entries.some((queued) => queued.id === id && queued.status !== "failed")
        );
        if (unresolvedDependencies.length) continue;
        await updateOutboxEntry(entry.id, {
          status: "failed",
          lastError: "Um ficheiro necessário não foi enviado; esta ação não foi sincronizada.",
        });
        continue;
      }
      if (!navigator.onLine || String(useUserStore.getState().dadosUsuario?.id) !== String(userId)) break;
      if (!await claimOutboxEntry(entry.id, userId)) continue;
      try {
        const response = await fetchWithAuth(entry.url, {
          method: entry.method,
          headers: entry.headers,
          body: restoreBody(entry.body),
          offlineQueue: false,
        });
        if (!response.ok) {
          const responseText = await response.text();
          await updateOutboxEntry(entry.id, {
            status: "failed",
            lastError: responseText || `HTTP ${response.status}`,
          });
          continue;
        }
        if (entry.url.endsWith("/api/upload-file")) {
          const uploadedFile = await response.clone().json().catch(() => ({}));
          if (uploadedFile.file_url) {
            await replaceQueuedUploadReference(userId, entry.id, uploadedFile.file_url);
            resolvedUpload = true;
          }
        }
        await deleteOutboxEntry(entry.id);
      } catch (error) {
        if (!navigator.onLine) {
          await updateOutboxEntry(entry.id, { status: "pending", lastError: error.message });
          break;
        }
        await updateOutboxEntry(entry.id, { status: "failed", lastError: error.message });
      }
    }
  } finally {
    replaying = false;
    notifyOfflineStorageChanged();
    if (resolvedUpload) {
      window.setTimeout(() => {
        void syncRequestOutbox(fetchWithAuth).catch((error) =>
          console.error("Falha ao continuar a fila após o upload:", error)
        );
      }, 0);
    }
  }
}

export function startOfflineRequestSync(fetchWithAuth) {
  if (removeListeners || typeof window === "undefined") return;
  const sync = () => {
    void syncRequestOutbox(fetchWithAuth).catch((error) =>
      console.error("Falha ao sincronizar a fila offline:", error)
    );
  };
  window.addEventListener("online", sync);
  const unsubscribe = useUserStore.subscribe((state, previousState) => {
    if (state.dadosUsuario?.id !== previousState.dadosUsuario?.id) sync();
  });
  const timer = window.setInterval(sync, 15000);
  removeListeners = () => {
    window.removeEventListener("online", sync);
    window.clearInterval(timer);
    unsubscribe();
  };
  sync();
}
