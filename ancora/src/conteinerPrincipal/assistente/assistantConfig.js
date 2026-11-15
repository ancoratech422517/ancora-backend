export const ASSISTANT_CHAT_TYPE = "assistant";
export const ASSISTANT_CHAT_ID = "ancora-assistant";
export const ASSISTANT_CHAT_NAME = "Assistente Âncora";

export function createAssistantChat(userId) {
  return {
    tipo_chat: ASSISTANT_CHAT_TYPE,
    id_amigo: ASSISTANT_CHAT_ID,
    nome_amigo: ASSISTANT_CHAT_NAME,
    foto_amigo: "none",
    nossa_sala: `${ASSISTANT_CHAT_ID}:${userId}`,
    status: "online",
  };
}
