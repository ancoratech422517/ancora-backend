import { useUserStore } from "../../../useUseSotore";

export async function iniciarChamadaVoz({ socket, dadosUsuario, destinatario }) {
  const store = useUserStore.getState();
  if (store.chamadaVozAtiva) return;

  if (!socket?.connected || !dadosUsuario?.id || !destinatario?.id_amigo) {
    store.setChamadaVozAtiva({
      direction: "outgoing",
      status: "error",
      error: "Não foi possível iniciar a chamada. Verifique a conexão e o usuário selecionado.",
    });
    return;
  }

  const callId = crypto.randomUUID();
  const call = {
    callId,
    roomName: `voice-${callId}`,
    direction: "outgoing",
    status: "ringing",
    peerId: String(destinatario.id_amigo),
    peerName: destinatario.nome_amigo || "Usuário",
    peerPhoto: destinatario.foto_amigo,
  };
  store.setChamadaVozAtiva(call);

  try {
    const resposta = await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error("Tempo esgotado ao iniciar a chamada.")), 10000);
      socket.emit("chamada_voz_iniciar", {
        call_id: callId,
        room_name: call.roomName,
        recipient_id: call.peerId,
      }, (resultado) => {
        clearTimeout(timeout);
        if (!resultado?.ok) {
          reject(new Error(resultado?.erro || "Não foi possível iniciar a chamada."));
          return;
        }
        resolve(resultado);
      });
    });

    if (!resposta?.ok) throw new Error("O servidor não confirmou a chamada.");
  } catch (erro) {
    const atual = useUserStore.getState().chamadaVozAtiva;
    if (atual?.callId === callId) {
      store.setChamadaVozAtiva({ ...atual, status: "error", error: erro.message });
    }
  }
}

export function chamadaRecebidaDePush(notificacao) {
  const payload = notificacao?.data && typeof notificacao.data === "object"
    ? { ...notificacao, ...notificacao.data }
    : notificacao;
  if (!payload || (
    payload.type !== "voice_call"
    && payload.notification_type !== "chamada_voz"
  )) return false;

  const callId = payload.call_id || payload.voice_call_id;
  const roomName = payload.room_name || payload.voice_room;
  const callerId = payload.caller_id || payload.sender_id || payload.voice_caller;
  if (!callId || !roomName || !callerId) {
    console.error("Notificação de chamada de voz incompleta:", payload);
    return false;
  }

  const store = useUserStore.getState();
  store.setChamadaVozAtiva({
    callId,
    roomName,
    direction: "incoming",
    status: "ringing",
    peerId: String(callerId),
    peerName: payload.caller_name || payload.voice_caller_name || "Usuário",
    peerPhoto: payload.caller_photo,
  });
  store.tocarSomChamada();
  return true;
}
