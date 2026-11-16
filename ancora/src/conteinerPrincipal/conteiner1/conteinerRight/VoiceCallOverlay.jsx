import { useEffect, useRef, useState } from "react";
import { Capacitor } from "@capacitor/core";
import PushyWeb from "pushy-sdk-web";
import {
  LiveKitRoom,
  RoomAudioRenderer,
  StartAudio,
  useRoomContext,
} from "@livekit/components-react";
import { RoomEvent } from "livekit-client";
import { useUserStore } from "../../../useUseSotore";
import { fetchComAuth } from "../../../utils/api";
import { chamadaRecebidaDePush } from "./voiceCalls";
import SunsetLiveMeeting from "./SunsetLiveMeeting";
import "./css/VoiceCallOverlay.css";

function atualizarChamada(callId, atualizar) {
  useUserStore.setState((state) => (
    state.chamadaVozAtiva?.callId === callId
      ? { chamadaVozAtiva: atualizar(state.chamadaVozAtiva) }
      : state
  ));
}

function CallRoomPresence({ callId }) {
  const room = useRoomContext();

  useEffect(() => {
    const atualizarParticipantes = () => {
      const participants = Array.from(room.remoteParticipants.values());
      const identities = participants.map((participant) => participant.identity);
      const connectedPeerIds = participants
        .map((participant) => participant.identity.match(/^user-(\d+)$/)?.[1])
        .filter(Boolean);
      useUserStore.setState((state) => {
        const chamada = state.chamadaVozAtiva;
        if (!chamada || chamada.callId !== callId) return state;
        const atuais = chamada.remoteParticipantIdentities || [];
        if (
          atuais.length === identities.length
          && atuais.every((identity, index) => identity === identities[index])
          && connectedPeerIds.every((peerId) => (chamada.acceptedPeerIds || []).includes(peerId))
        ) return state;
        return {
          chamadaVozAtiva: {
            ...chamada,
            remoteParticipantIdentities: identities,
            pendingPeerIds: (chamada.pendingPeerIds || []).filter(
              (peerId) => !connectedPeerIds.includes(peerId),
            ),
            acceptedPeerIds: [...new Set([
              ...(chamada.acceptedPeerIds || []),
              ...connectedPeerIds,
            ])],
          },
        };
      });
    };

    atualizarParticipantes();
    room.on(RoomEvent.ParticipantConnected, atualizarParticipantes);
    room.on(RoomEvent.ParticipantDisconnected, atualizarParticipantes);
    return () => {
      room.off(RoomEvent.ParticipantConnected, atualizarParticipantes);
      room.off(RoomEvent.ParticipantDisconnected, atualizarParticipantes);
    };
  }, [callId, room]);

  return null;
}

function AudioCallControls({
  muted,
  onMutedChange,
  speakerEnabled,
  onSpeakerChange,
  onHangup,
  tipoChamada,
  onToggleTipo,
  onInviteUser,
}) {
  const room = useRoomContext();

  const alternarMicrofone = async () => {
    const habilitado = room.localParticipant.isMicrophoneEnabled;
    try {
      await room.localParticipant.setMicrophoneEnabled(!habilitado);
      onMutedChange(habilitado);
    } catch (erro) {
      console.error("Não foi possível alterar o microfone:", erro);
    }
  };

  return (
    <>
      {tipoChamada !== "video" && <RoomAudioRenderer muted={!speakerEnabled} />}
      <div className="voice-call-connected-controls">
        <StartAudio label="Ativar áudio da chamada" />
        <div className="voice-call-controls">
          <button
            type="button"
            className={`voice-call-button${muted ? "" : " is-on"}`}
            aria-label={muted ? "Ativar microfone" : "Silenciar microfone"}
            aria-pressed={muted}
            onClick={() => void alternarMicrofone()}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              {muted
                ? <path d="m3 3 18 18M9 9v3a3 3 0 0 0 5.2 2M15 9V6a3 3 0 0 0-5.8-1M5 11a7 7 0 0 0 12 4.9M12 18v3m-4 0h8" />
                : <><rect x="9" y="3" width="6" height="12" rx="3" /><path d="M5 11a7 7 0 0 0 14 0M12 18v3" /></>}
            </svg>
          </button>
          {tipoChamada !== "video" && (
            <button
              type="button"
              className={`voice-call-button${speakerEnabled ? " is-on" : ""}`}
              aria-label={speakerEnabled ? "Desativar áudio" : "Ativar áudio"}
              aria-pressed={speakerEnabled}
              onClick={() => onSpeakerChange((enabled) => !enabled)}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                {speakerEnabled
                  ? <path d="M4 9v6h4l5 4V5L8 9H4zm13-1a5 5 0 0 1 0 8" />
                  : <path d="M4 9v6h4l5 4V5L8 9H4zm14-1 4 8m0-8-4 8" />}
              </svg>
            </button>
          )}
          <button
            type="button"
            className="voice-call-button"
            aria-label={tipoChamada === "video" ? "Voltar para chamada de voz" : "Alternar para chamada em vídeo"}
            title={tipoChamada === "video" ? "Voltar para chamada de voz" : "Alternar para chamada em vídeo"}
            onClick={() => onToggleTipo(tipoChamada === "video" ? "voice" : "video")}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              {tipoChamada === "video"
                ? <><path d="M5 7h9a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2z" /><path d="m16 10 4-2v8l-4-2" /></>
                : <><rect x="3" y="6" width="12" height="12" rx="2" /><path d="m15 10 6-4v12l-6-4" /></>}
            </svg>
          </button>
          <button
            type="button"
            className="voice-call-button"
            aria-label="Convidar amigo para a chamada"
            title="Convidar amigo"
            onClick={onInviteUser}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="10" cy="7" r="4" />
              <path d="M19 8v6M16 11h6" />
            </svg>
          </button>
          <button type="button" className="voice-call-button voice-call-button--end" aria-label="Encerrar chamada" onClick={onHangup}>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 15c5-5 13-5 18 0l-2.5 3-3.5-1.5V14c-2-.8-4-.8-6 0v2.5L5.5 18z" /></svg>
          </button>
        </div>
      </div>
    </>
  );
}

function VoiceCallCard({ chamada, statusTexto, children, fecharChamada, atenderChamada }) {
  const iniciais = (chamada.peerName || "U")
    .split(/\s+/)
    .slice(0, 2)
    .map((parte) => parte[0])
    .join("")
    .toUpperCase();

  return (
    <section className="voice-call-card">
      <div className="voice-call-top">
        <span className="voice-call-state">
          {chamada.status === "connected"
            ? "Em chamada"
            : chamada.direction === "incoming" ? "Chamada recebida" : "Chamada de voz"}
        </span>
        <strong className="voice-call-name">{chamada.peerName}</strong>
        <span className="voice-call-timer">{statusTexto}</span>
      </div>
      <div className="voice-call-avatar-wrap">
        <span className="voice-call-ripple" />
        <span className="voice-call-ripple" />
        <span className="voice-call-ripple" />
        <div
          className="voice-call-avatar"
          style={chamada.peerPhoto && chamada.peerPhoto !== "none"
            ? { backgroundImage: `url("${chamada.peerPhoto}")` }
            : undefined}
        >
          {!chamada.peerPhoto || chamada.peerPhoto === "none" ? iniciais : null}
        </div>
      </div>
      <div className="voice-call-equalizer" aria-hidden="true">
        {Array.from({ length: 14 }, (_, indice) => (
          <i key={indice} style={{ animationDelay: `${indice * -0.07}s` }} />
        ))}
      </div>
      {chamada.status === "error" && (
        <p className="voice-call-error" role="alert">{chamada.error}</p>
      )}
      {children || (
        chamada.direction === "incoming" && chamada.status === "ringing" ? (
          <div className="voice-call-controls">
            <button type="button" className="voice-call-button voice-call-button--accept" aria-label="Atender chamada" onClick={atenderChamada}>
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 15c5-5 13-5 18 0l-2.5 3-3.5-1.5V14c-2-.8-4-.8-6 0v2.5L5.5 18z" /></svg>
            </button>
            <button type="button" className="voice-call-button voice-call-button--end" aria-label="Rejeitar chamada" onClick={() => fecharChamada("rejected")}>
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 15c5-5 13-5 18 0l-2.5 3-3.5-1.5V14c-2-.8-4-.8-6 0v2.5L5.5 18z" /></svg>
            </button>
          </div>
        ) : chamada.status === "error" ? (
          <div className="voice-call-controls">
            <button type="button" className="voice-call-button voice-call-button--end" aria-label="Fechar chamada" onClick={() => fecharChamada("ended")}>
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18" /></svg>
            </button>
          </div>
        ) : (
          <div className="voice-call-controls">
            <button type="button" className="voice-call-button voice-call-button--end" aria-label="Cancelar chamada" onClick={() => fecharChamada("ended")}>
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 15c5-5 13-5 18 0l-2.5 3-3.5-1.5V14c-2-.8-4-.8-6 0v2.5L5.5 18z" /></svg>
          </button>
        </div>
        )
      )}
    </section>
  );
}

function formatarDuracao(segundos) {
  const minutos = String(Math.floor(segundos / 60)).padStart(2, "0");
  const restantes = String(segundos % 60).padStart(2, "0");
  return `${minutos}:${restantes}`;
}

export default function VoiceCallOverlay() {
  const chamada = useUserStore((state) => state.chamadaVozAtiva);
  const socket = useUserStore((state) => state.socket);
  const usuario = useUserStore((state) => state.dadosUsuario);
  const amigos = useUserStore((state) => state.amigos);
  const urlBancoDeDados = useUserStore((state) => state.urlBancoDeDados);
  const setChamadaVozAtiva = useUserStore((state) => state.setChamadaVozAtiva);
  const pararSomChamada = useUserStore((state) => state.pararSomChamada);
  const [token, setToken] = useState(null);
  const [serverUrl, setServerUrl] = useState(null);
  const [microfoneSilenciado, setMicrofoneSilenciado] = useState(false);
  const [altoFalanteAtivo, setAltoFalanteAtivo] = useState(true);
  const [duracao, setDuracao] = useState(0);
  const [mostrarConvites, setMostrarConvites] = useState(false);
  const [amigoSelecionado, setAmigoSelecionado] = useState("");
  const pushListenerUser = useRef(null);
  const callTimer = useRef(null);

  useEffect(() => {
    if (!socket) return undefined;

    const receberChamada = (convite) => {
      const atual = useUserStore.getState().chamadaVozAtiva;
      if (atual) {
        socket.emit("responder_chamada_voz", {
          call_id: convite?.call_id,
          room_name: convite?.room_name,
          caller_id: convite?.caller_id,
          response: "rejected",
        });
        return;
      }
      chamadaRecebidaDePush({ ...convite, type: "voice_call" });
    };
    const receberEstado = (estado) => {
      const chamadaAtual = useUserStore.getState().chamadaVozAtiva;
      if (!chamadaAtual || chamadaAtual.callId !== estado?.call_id) return;

      atualizarChamada(estado?.call_id, (atual) => {
        if (estado.status === "accepted") {
          const peerId = String(estado.peer_id || atual.peerId);
          return {
            ...atual,
            status: atual.status === "connected" ? "connected" : "connecting",
            type: estado.call_type || atual?.type || "voice",
            peerId,
            authorizationPeerId: atual.authorizationPeerId || atual.peerId,
            pendingPeerIds: (atual.pendingPeerIds || []).filter((id) => id !== peerId),
            acceptedPeerIds: [...new Set([...(atual.acceptedPeerIds || []), peerId])],
            peerName: estado.peer_name || atual.peerName,
          };
        }
        if (estado.status === "rejected" || estado.status === "ended") {
          const peerId = estado.peer_id == null ? null : String(estado.peer_id);
          const peerIdentity = peerId == null ? null : `user-${peerId}`;
          const remoteParticipants = atual.remoteParticipantIdentities || [];
          const remainingParticipants = peerIdentity
            ? remoteParticipants.filter((identity) => identity !== peerIdentity)
            : remoteParticipants;
          const pendingPeerIds = (atual.pendingPeerIds || []).filter((id) => id !== peerId);
          const acceptedPeerIds = (atual.acceptedPeerIds || []).filter((id) => id !== peerId);

          if (
            remainingParticipants.length > 0
            || pendingPeerIds.length > 0
            || acceptedPeerIds.length > 0
          ) {
            return {
              ...atual,
              pendingPeerIds,
              acceptedPeerIds,
              remoteParticipantIdentities: remainingParticipants,
            };
          }
          return {
            ...atual,
            status: "error",
            pendingPeerIds,
            acceptedPeerIds,
            remoteParticipantIdentities: remainingParticipants,
            error: estado.status === "rejected"
              ? "A chamada foi recusada."
              : "A chamada foi encerrada.",
          };
        }
        return atual;
      });
      if (estado?.status !== "accepted") pararSomChamada();
    };

    socket.on("chamada_voz_recebida", receberChamada);
    socket.on("chamada_voz_status", receberEstado);
    return () => {
      socket.off("chamada_voz_recebida", receberChamada);
      socket.off("chamada_voz_status", receberEstado);
    };
  }, [socket, pararSomChamada]);

  useEffect(() => {
    if (!usuario?.id || pushListenerUser.current === String(usuario.id)) return undefined;
    pushListenerUser.current = String(usuario.id);

    const receberPush = (notificacao) => {
      chamadaRecebidaDePush(notificacao);
    };

    if (Capacitor.isNativePlatform()) {
      const pushyNativo = globalThis.Pushy;
      if (typeof pushyNativo?.setNotificationListener === "function") {
        pushyNativo.setNotificationListener(receberPush);
      }
      if (typeof pushyNativo?.setNotificationClickListener === "function") {
        pushyNativo.setNotificationClickListener(receberPush);
      }
    } else {
      void PushyWeb.setNotificationListener(receberPush).catch((erro) => {
        console.error("Não foi possível ativar o recebimento de chamadas Pushy:", erro);
      });
    }

    return undefined;
  }, [usuario?.id]);

  useEffect(() => {
    const parametros = new URLSearchParams(window.location.search);
    const callId = parametros.get("voice_call_id");
    const roomName = parametros.get("voice_room");
    const callerId = parametros.get("voice_caller");
    if (!callId || !roomName || !callerId) return;

    chamadaRecebidaDePush({
      type: "voice_call",
      call_id: callId,
      room_name: roomName,
      caller_id: callerId,
      caller_name: parametros.get("voice_caller_name"),
    });
    parametros.delete("voice_call_id");
    parametros.delete("voice_room");
    parametros.delete("voice_caller");
    parametros.delete("voice_caller_name");
    const query = parametros.toString();
    window.history.replaceState(
      {},
      "",
      `${window.location.pathname}${query ? `?${query}` : ""}${window.location.hash}`,
    );
  }, []);

  const authorizationPeerId = chamada?.authorizationPeerId || chamada?.peerId;

  useEffect(() => {
    if (
      !chamada?.callId
      || !authorizationPeerId
      || !usuario?.id
      || chamada.status !== "connecting"
    ) return undefined;
    let cancelada = false;

    const conectar = async () => {
      try {
        const resposta = await fetchComAuth(`${urlBancoDeDados}/api/livekit/call-token`, {
          method: "POST",
          body: JSON.stringify({
            callId: chamada.callId,
            roomName: chamada.roomName,
            peerId: authorizationPeerId,
            callType: chamada.type || "voice",
          }),
        });
        const dados = await resposta.json();
        if (!resposta.ok) throw new Error(dados.error || "Não foi possível conectar à chamada.");
        if (cancelada) return;
        setToken(dados.token);
        setServerUrl(dados.serverUrl);
      } catch (erro) {
        if (!cancelada) {
          atualizarChamada(chamada.callId, (atual) => ({
            ...atual,
            status: "error",
            error: erro.message || "Não foi possível conectar à chamada.",
          }));
        }
      }
    };

    void conectar();
    return () => {
      cancelada = true;
    };
  }, [chamada?.callId, chamada?.status, chamada?.roomName, authorizationPeerId, chamada?.type, usuario?.id, urlBancoDeDados]);

  useEffect(() => {
    if (chamada?.status !== "connected") {
      setDuracao(0);
      clearInterval(callTimer.current);
      return undefined;
    }
    const iniciouEm = Date.now();
    callTimer.current = setInterval(
      () => setDuracao(Math.floor((Date.now() - iniciouEm) / 1000)),
      1000,
    );
    return () => clearInterval(callTimer.current);
  }, [chamada?.status]);

  const fecharChamada = (resposta) => {
    const atual = useUserStore.getState().chamadaVozAtiva;
    if (!atual) return;

    pararSomChamada();
    if (atual.direction === "incoming" && atual.status === "ringing") {
      socket?.emit("responder_chamada_voz", {
        call_id: atual.callId,
        room_name: atual.roomName,
        caller_id: atual.peerId,
        response: resposta || "rejected",
      });
    } else {
      socket?.emit("encerrar_chamada_voz", {
        call_id: atual.callId,
        room_name: atual.roomName,
        peer_id: atual.peerId,
      });
    }
    setToken(null);
    setServerUrl(null);
    setChamadaVozAtiva(null);
  };

  const atenderChamada = () => {
    if (!socket?.connected || !usuario?.id) {
      atualizarChamada(chamada.callId, (atual) => ({
        ...atual,
        status: "error",
        error: "Conecte-se à sua conta e tente novamente.",
      }));
      return;
    }

    socket.emit("responder_chamada_voz", {
      call_id: chamada.callId,
      room_name: chamada.roomName,
      caller_id: chamada.peerId,
      response: "accepted",
      call_type: chamada.type || "voice",
    }, (resposta) => {
      if (!resposta?.ok) {
        atualizarChamada(chamada.callId, (atual) => ({
          ...atual,
          status: "error",
          error: resposta?.erro || "Não foi possível atender à chamada.",
        }));
        return;
      }
      pararSomChamada();
      atualizarChamada(chamada.callId, (atual) => ({
        ...atual,
        status: "connecting",
        pendingPeerIds: (atual.pendingPeerIds || []).filter((id) => id !== String(atual.peerId)),
        acceptedPeerIds: [...new Set([...(atual.acceptedPeerIds || []), String(atual.peerId)])],
      }));
    });
  };

  const conectado = () => {
    atualizarChamada(chamada.callId, (atual) => ({ ...atual, status: "connected" }));
  };

  const alternarTipoChamada = (novoTipo) => {
    if (!chamada || !socket?.connected || !usuario?.id) return;
    const tipo = novoTipo === "video" ? "video" : "voice";
    if ((chamada.type || "voice") === tipo) return;
    atualizarChamada(chamada.callId, (atual) => ({ ...atual, type: tipo, status: "connecting" }));
    setToken(null);
    setServerUrl(null);
  };

  const convidarAmigoParaChamada = () => {
    if (!chamada || !socket?.connected || !amigoSelecionado) return;

    const peerId = String(amigoSelecionado);
    atualizarChamada(chamada.callId, (atual) => ({
      ...atual,
      pendingPeerIds: [...new Set([...(atual.pendingPeerIds || []), peerId])],
    }));

    socket.emit("chamada_voz_iniciar", {
      call_id: chamada.callId,
      room_name: chamada.roomName,
      recipient_id: peerId,
      call_type: chamada.type || "voice",
    }, (resposta) => {
      if (!resposta?.ok) {
        atualizarChamada(chamada.callId, (atual) => ({
          ...atual,
          pendingPeerIds: (atual.pendingPeerIds || []).filter((id) => id !== peerId),
        }));
        console.error("Não foi possível convidar para a chamada:", resposta?.erro || "Erro desconhecido");
        return;
      }
      setMostrarConvites(false);
      setAmigoSelecionado("");
    });
  };

  const encerrarPorDesconexao = () => {
    setToken(null);
    setServerUrl(null);
    pararSomChamada();
    setChamadaVozAtiva(null);
  };

  if (!chamada) return null;

  const iniciais = (chamada.peerName || "U")
    .split(/\s+/)
    .slice(0, 2)
    .map((parte) => parte[0])
    .join("")
    .toUpperCase();
  const statusTexto = chamada.status === "connected"
    ? `Em chamada · ${formatarDuracao(duracao)}`
    : chamada.status === "connecting"
      ? "Conectando..."
      : chamada.status === "error"
        ? chamada.error
        : chamada.direction === "incoming"
          ? "Chamada de voz recebida"
          : "Chamando...";
  const mostrarControles = ["connecting", "connected"].includes(chamada.status) && token && serverUrl;
  const amigosParaConvidar = (amigos || []).filter(
    (amigo) => String(amigo?.id_amigo) !== String(chamada.peerId)
      && String(amigo?.id_amigo) !== String(usuario?.id),
  );
  const painelConvites = mostrarConvites && (
    <div className="voice-call-invite-panel">
      <label htmlFor="voice-call-invite">Convidar para a chamada</label>
      <select
        id="voice-call-invite"
        value={amigoSelecionado}
        onChange={(evento) => setAmigoSelecionado(evento.target.value)}
      >
        <option value="">Selecione um amigo</option>
        {amigosParaConvidar.map((amigo) => (
          <option key={amigo.id_amigo} value={String(amigo.id_amigo)}>
            {amigo.nome_amigo}
          </option>
        ))}
      </select>
      <div className="voice-call-controls voice-call-invite-actions">
        <button type="button" className="voice-call-button voice-call-button--accept" onClick={convidarAmigoParaChamada}>
          Convidar
        </button>
        <button type="button" className="voice-call-button" onClick={() => setMostrarConvites(false)}>
          Fechar
        </button>
      </div>
    </div>
  );
  const chamadaEmVideo = chamada.type === "video";

  return (
    <div
      className={`voice-call-overlay${mostrarControles && chamadaEmVideo ? " voice-call-overlay--meeting" : ""}`}
      role="dialog"
      aria-modal="true"
      aria-label={chamadaEmVideo ? "Chamada de vídeo" : "Chamada de voz"}
    >
      {mostrarControles ? (
        <LiveKitRoom
          token={token}
          serverUrl={serverUrl}
          connect
          audio
          video={chamada?.type === "video"}
          style={chamadaEmVideo ? { width: "100%", height: "100%" } : undefined}
          onConnected={conectado}
          onDisconnected={encerrarPorDesconexao}
          onError={(erro) => {
            console.error("Erro na conexão LiveKit de voz:", erro);
            const chamadaAtual = useUserStore.getState().chamadaVozAtiva;
            if (chamadaAtual?.callId === chamada.callId && chamadaAtual.status !== "connected") {
              atualizarChamada(chamada.callId, (atual) => ({
                ...atual,
                status: "error",
                error: "Não foi possível estabelecer a conexão de voz.",
              }));
            }
          }}
          data-lk-theme="default"
        >
          <CallRoomPresence callId={chamada.callId} />
          {chamadaEmVideo ? (
            <SunsetLiveMeeting
              nomeTurma={`Chamada com ${chamada.peerName || "Participante"}`}
              onLeave={() => fecharChamada("ended")}
              toolbarActions={(
                <>
                  <button
                    type="button"
                    className="sunset-control"
                    onClick={() => alternarTipoChamada("voice")}
                    aria-label="Voltar para chamada de voz"
                    title="Voltar para chamada de voz"
                  >
                    🎙️
                  </button>
                  <button
                    type="button"
                    className="sunset-control"
                    onClick={() => setMostrarConvites((ativo) => !ativo)}
                    aria-label="Convidar amigo para a chamada"
                    aria-expanded={mostrarConvites}
                    title="Convidar amigo"
                  >
                    ＋
                  </button>
                </>
              )}
              floatingPanel={painelConvites}
            />
          ) : (
            <VoiceCallCard
              chamada={chamada}
              statusTexto={statusTexto}
              fecharChamada={fecharChamada}
            >
              <div className="voice-call-mobile-stack">
                <AudioCallControls
                  muted={microfoneSilenciado}
                  onMutedChange={setMicrofoneSilenciado}
                  speakerEnabled={altoFalanteAtivo}
                  onSpeakerChange={setAltoFalanteAtivo}
                  onHangup={() => fecharChamada("ended")}
                  tipoChamada={chamada.type || "voice"}
                  onToggleTipo={alternarTipoChamada}
                  onInviteUser={() => setMostrarConvites((ativo) => !ativo)}
                />
                {painelConvites}
              </div>
            </VoiceCallCard>
          )}
        </LiveKitRoom>
      ) : (
        <VoiceCallCard
          chamada={chamada}
          statusTexto={statusTexto}
          fecharChamada={fecharChamada}
          atenderChamada={atenderChamada}
        />
      )}
    </div>
  );
}
