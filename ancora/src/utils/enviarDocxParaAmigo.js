import { useUserStore } from "../useUseSotore";
import { Enviar_menssagem } from "../service/socket_service_enviar_menssagem";
import { queueChatMessage } from "../service/chatOfflineSync";
import { uploadChatFileInChunks } from "./chatFileUpload";

const DOCX_MIME = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

export async function enviarDocxParaAmigo(file, amigo) {
  const state = useUserStore.getState();
  const friendId = amigo?.id_amigo;
  const roomName = amigo?.nossa_sala;
  if (!friendId || !roomName) throw new Error("O amigo selecionado não tem uma conversa disponível.");
  const chat = {
    id_amigo: friendId,
    nome_amigo: amigo.nome || amigo.nome_amigo || "Amigo",
    foto_amigo: amigo.foto_amigo || "none",
    nossa_sala: roomName,
  };
  if (!state.dadosUsuario?.id) throw new Error("Inicia sessão antes de enviar o documento.");
  state.setChatAtivo(chat);
  state.setMostrarChat(true);
  state.setAtivar("conteiner1");
  state.set_Tipo_Chat_Turma?.(false);
  if (state.socket?.connected) {
    state.socket.emit("Entrar_na_sala", {
      nossa_sala: roomName,
      id_remitente: state.dadosUsuario.id,
      sala_antiga: state.ChatAtivo?.nossa_sala,
    });
    state.socket.emit("buscar_menssagens", { nossa_sala: roomName });
  }

  const buildMessagePayload = (uploaded = {}) => JSON.stringify({
    isFile: true,
    mimeType: DOCX_MIME,
    fileName: file.name,
    fileSize: uploaded.size || file.size,
    fileUrl: uploaded.file_url || "",
    publicId: uploaded.public_id || "",
    folder: uploaded.folder,
    format: uploaded.format,
    resourceType: uploaded.resource_type || "raw",
  });

  if (!navigator.onLine || !state.socket?.connected) {
    await queueChatMessage({
      nossa_sala: roomName,
      id_amigo: friendId,
      nome_amigo: chat.nome_amigo,
      menssagem: buildMessagePayload(),
      id_remitente: state.dadosUsuario.id,
      nome_remitente: state.dadosUsuario.nome,
      foto_usuario: state.dadosUsuario.foto_usuario,
      reply_to: null,
    }, { file, filename: file.name });
    return;
  }

  const uploaded = await uploadChatFileInChunks(file, { backendUrl: state.urlBancoDeDados });
  await new Promise((resolve, reject) => {
    Enviar_menssagem(
      null,
      state.socket,
      roomName,
      friendId,
      chat.nome_amigo,
      buildMessagePayload(uploaded),
      state.dadosUsuario,
      state.setQuantidadeMensagemNaoLida,
      null,
      (result) => result?.success
        ? resolve()
        : reject(new Error(result?.error || "O chat não guardou o documento.")),
      null,
    );
  });
}