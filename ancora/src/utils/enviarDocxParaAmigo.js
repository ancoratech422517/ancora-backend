import { fetchComAuth } from "./api";
import { useUserStore } from "../useUseSotore";
import { Enviar_menssagem } from "../service/socket_service_enviar_menssagem";

const DOCX_MIME = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

async function carregarDocx(file, backendUrl) {
  const signatureResponse = await fetchComAuth(`${backendUrl}/api/create-upload-signature`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      filename: file.name,
      file_size: file.size,
      mime_type: DOCX_MIME,
      resource_type: "raw",
    }),
  });
  const signature = await signatureResponse.json().catch(() => ({}));
  if (!signatureResponse.ok || !signature.success) {
    throw new Error(signature.error || "Não foi possível iniciar o envio do documento.");
  }

  const formData = new FormData();
  formData.append("file", file, file.name);
  formData.append("api_key", signature.api_key);
  formData.append("timestamp", String(signature.timestamp));
  formData.append("signature", signature.signature);
  formData.append("folder", signature.folder || "");
  formData.append("public_id", signature.public_id);
  if (signature.upload_preset) formData.append("upload_preset", signature.upload_preset);

  const cloudinaryResult = await new Promise((resolve, reject) => {
    const request = new XMLHttpRequest();
    request.open("POST", `https://api.cloudinary.com/v1_1/${signature.cloud_name}/raw/upload`);
    request.setRequestHeader("X-Unique-Upload-Id", signature.upload_id);
    request.setRequestHeader("Content-Range", `bytes 0-${file.size - 1}/${file.size}`);
    request.onload = () => {
      let result = {};
      try {
        result = JSON.parse(request.responseText);
      } catch {
        reject(new Error("O serviço de ficheiros devolveu uma resposta inválida."));
        return;
      }
      if (request.status < 200 || request.status >= 300 || result.error) {
        reject(new Error(result.error?.message || result.message || "Falha ao carregar o documento."));
        return;
      }
      resolve(result);
    };
    request.onerror = () => reject(new Error("Falha de rede ao carregar o documento."));
    request.send(formData);
  });

  const finalizeResponse = await fetchComAuth(`${backendUrl}/api/finalize-chunked-upload`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      upload_ticket: signature.upload_ticket,
      public_id: cloudinaryResult.public_id || signature.public_id,
      filename: file.name,
      mime_type: DOCX_MIME,
      secure_url: cloudinaryResult.secure_url,
      url: cloudinaryResult.url,
      bytes: cloudinaryResult.bytes || file.size,
      format: cloudinaryResult.format || "docx",
      resource_type: "raw",
    }),
  });
  const finalData = await finalizeResponse.json().catch(() => ({}));
  if (!finalizeResponse.ok || !finalData.success) {
    throw new Error(finalData.error || "O backend não confirmou o documento carregado.");
  }

  return {
    fileUrl: finalData.file_url || cloudinaryResult.secure_url || cloudinaryResult.url,
    publicId: finalData.public_id || cloudinaryResult.public_id || signature.public_id,
    folder: finalData.folder || signature.folder,
    format: finalData.format || cloudinaryResult.format || "docx",
    fileSize: finalData.size || cloudinaryResult.bytes || file.size,
  };
}

export async function enviarDocxParaAmigo(file, amigo) {
  const state = useUserStore.getState();
  const friendId = amigo?.id_amigo;
  const roomName = amigo?.nossa_sala;
  if (!friendId || !roomName) throw new Error("O amigo selecionado não tem uma conversa disponível.");
  if (!state.socket?.connected) throw new Error("O chat está desconectado. Reconecte e tente novamente.");

  const uploaded = await carregarDocx(file, state.urlBancoDeDados);
  const chat = {
    id_amigo: friendId,
    nome_amigo: amigo.nome || amigo.nome_amigo || "Amigo",
    foto_amigo: amigo.foto_amigo || "none",
    nossa_sala: roomName,
  };
  state.socket.emit("Entrar_na_sala", {
    nossa_sala: roomName,
    id_remitente: state.dadosUsuario?.id,
    sala_antiga: state.ChatAtivo?.nossa_sala,
  });
  state.setChatAtivo(chat);
  state.setMostrarChat(true);
  state.setAtivar("conteiner1");
  state.set_Tipo_Chat_Turma?.(false);
  state.socket.emit("buscar_menssagens", { nossa_sala: roomName });

  const messagePayload = JSON.stringify({
    isFile: true,
    mimeType: DOCX_MIME,
    fileName: file.name,
    fileSize: uploaded.fileSize,
    fileUrl: uploaded.fileUrl,
    publicId: uploaded.publicId,
    folder: uploaded.folder,
    format: uploaded.format,
    resourceType: "raw",
  });
  const temporaryId = `temp-rental-docx-${Date.now()}`;
  const previewUrl = URL.createObjectURL(file);
  state.setMenssagem({
    id: temporaryId,
    menssagem: messagePayload,
    blobUrl: previewUrl,
    id_remitente: state.dadosUsuario.id,
    id_destinatario: friendId,
    nossa_sala: roomName,
    data_envio: new Date().toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" }),
    lida: false,
    nome_remitente: state.dadosUsuario.nome || "Você",
  });

  await new Promise((resolve, reject) => {
    const timeout = window.setTimeout(() => {
      state.elimiar_menssagem_array?.(temporaryId, roomName);
      URL.revokeObjectURL(previewUrl);
      reject(new Error("O chat não confirmou o envio do documento."));
    }, 15000);
    Enviar_menssagem(
      null,
      state.socket,
      roomName,
      friendId,
      chat.nome_amigo,
      messagePayload,
      state.dadosUsuario,
      state.setQuantidadeMensagemNaoLida,
      null,
      (result) => {
        window.clearTimeout(timeout);
        if (result?.success) resolve();
        else {
          state.elimiar_menssagem_array?.(temporaryId, roomName);
          URL.revokeObjectURL(previewUrl);
          reject(new Error(result?.error || "O chat não guardou o documento."));
        }
      },
      null,
    );
  });
}