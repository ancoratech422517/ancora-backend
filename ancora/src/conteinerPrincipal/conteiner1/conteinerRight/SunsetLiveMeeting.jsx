import { useEffect, useRef, useState } from "react";
import {
  RoomAudioRenderer,
  VideoTrack,
  useChat,
  useIsSpeaking,
  useLocalParticipant,
  useParticipants,
  useRoomContext,
  useTracks,
} from "@livekit/components-react";
import { RoomEvent, Track } from "livekit-client";
import "./css/SunsetLiveMeeting.css";

const CONTROL_TOPIC = "ancora-live-control";
const REACTION_EMOJIS = ["👍", "❤️", "😂", "👏", "🎉", "😮", "🔥", "🙏"];

function iniciais(nome) {
  return (nome || "U")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((parte) => parte[0])
    .join("")
    .toUpperCase();
}

function ParticipantPhoto({ trackRef, audioOnly, handRaised }) {
  const participant = trackRef.participant;
  const speaking = useIsSpeaking(participant);
  const name = participant.name || participant.identity || "Participante";
  const hasVideo = Boolean(trackRef.publication && !trackRef.publication.isMuted);
  const microphoneMuted = participant.getTrackPublication(Track.Source.Microphone)?.isMuted ?? true;

  return (
    <article className={`sunset-photo${speaking ? " is-speaking" : ""}${participant.isLocal ? " is-local" : ""}`}>
      <div className="sunset-photo-image">
        {hasVideo && !audioOnly ? (
          <VideoTrack trackRef={trackRef} />
        ) : (
          <div className="sunset-avatar" aria-label={`Câmara desligada: ${name}`}>
            <span>{iniciais(name)}</span>
          </div>
        )}
        {handRaised && <span className="sunset-hand-raised" title="Mão levantada">✋</span>}
      </div>
      <div className="sunset-photo-caption">
        <span className="sunset-participant-name">{name}{participant.isLocal ? " (Tu)" : ""}</span>
        <span className={`sunset-participant-state${microphoneMuted ? " is-muted" : ""}`} aria-label={microphoneMuted ? "Microfone desligado" : speaking ? "A falar" : ""}>
          {microphoneMuted ? "🔇" : speaking ? "●" : ""}
        </span>
      </div>
    </article>
  );
}

function ChatPanel({ participants, onClose }) {
  const { chatMessages, send, isSending } = useChat();
  const [message, setMessage] = useState("");
  const [sendError, setSendError] = useState("");

  const enviarMensagem = async (event) => {
    event.preventDefault();
    const texto = message.trim();
    if (!texto || isSending) return;
    setSendError("");
    try {
      await send(texto);
      setMessage("");
    } catch (error) {
      console.error("Não foi possível enviar a mensagem da live:", error);
      setSendError("A mensagem não foi enviada. Tente novamente.");
    }
  };

  return (
    <aside className="sunset-chat" aria-label="Chat da turma">
      <div className="sunset-chat-header">
        <strong>Chat da turma</strong>
        <button type="button" className="sunset-icon-button" onClick={onClose} aria-label="Fechar chat" title="Fechar chat">×</button>
      </div>
      <div className="sunset-chat-messages" aria-live="polite">
        {chatMessages.map((item, index) => {
          const identity = item.from?.identity;
          const author = participants.find((participant) => participant.identity === identity);
          return (
            <div className={`sunset-chat-message${author?.isLocal ? " is-mine" : ""}`} key={`${item.timestamp}-${index}`}>
              <small>{author?.name || identity || "Participante"}</small>
              <span>{item.message}</span>
            </div>
          );
        })}
      </div>
      <form className="sunset-chat-form" onSubmit={(event) => void enviarMensagem(event)}>
        <input
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          placeholder="Escreve uma mensagem..."
          aria-label="Mensagem para a turma"
          maxLength={1000}
        />
        <button type="submit" disabled={!message.trim() || isSending} aria-label="Enviar mensagem" title="Enviar mensagem">➤</button>
      </form>
      {sendError && <p className="sunset-chat-error" role="alert">{sendError}</p>}
    </aside>
  );
}

function formatarDuracao(segundos) {
  const minutos = Math.floor(segundos / 60);
  const restantes = segundos % 60;
  return `${String(minutos).padStart(2, "0")}:${String(restantes).padStart(2, "0")}`;
}

export default function SunsetLiveMeeting({ nomeTurma, onLeave }) {
  const room = useRoomContext();
  const participants = useParticipants();
  const cameraTracks = useTracks([{ source: Track.Source.Camera, withPlaceholder: true }]);
  const screenTracks = useTracks([Track.Source.ScreenShare]);
  const {
    localParticipant,
    isMicrophoneEnabled,
    isCameraEnabled,
    isScreenShareEnabled,
  } = useLocalParticipant();
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [audioOnly, setAudioOnly] = useState(false);
  const [cameraBeforeAudioOnly, setCameraBeforeAudioOnly] = useState(false);
  const [handRaised, setHandRaised] = useState({});
  const [reactions, setReactions] = useState([]);
  const [reactionMenuOpen, setReactionMenuOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [notice, setNotice] = useState("");
  const meetingRef = useRef(null);

  useEffect(() => {
    const timer = window.setInterval(() => setElapsedSeconds((seconds) => seconds + 1), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const receberControlo = (payload, participant, _kind, topic) => {
      if (topic !== CONTROL_TOPIC || !participant) return;
      try {
        const event = JSON.parse(new TextDecoder().decode(payload));
        if (event.type === "hand") {
          setHandRaised((current) => ({ ...current, [participant.identity]: Boolean(event.raised) }));
        }
        if (event.type === "reaction" && typeof event.emoji === "string") {
          const reaction = {
            id: `${Date.now()}-${Math.random()}`,
            emoji: event.emoji,
            name: participant.name || participant.identity || "Participante",
          };
          setReactions((current) => [...current, reaction]);
          window.setTimeout(() => {
            setReactions((current) => current.filter((item) => item.id !== reaction.id));
          }, 3600);
        }
      } catch (error) {
        console.warn("Sinal de controlo da live inválido:", error);
      }
    };

    room.on(RoomEvent.DataReceived, receberControlo);
    return () => room.off(RoomEvent.DataReceived, receberControlo);
  }, [room]);

  const enviarControlo = async (event) => {
    try {
      await localParticipant.publishData(
        new TextEncoder().encode(JSON.stringify(event)),
        { reliable: true, topic: CONTROL_TOPIC },
      );
    } catch (error) {
      console.error("Não foi possível enviar o controlo da live:", error);
      setNotice("Não foi possível enviar esta ação para a turma.");
      window.setTimeout(() => setNotice(""), 3500);
    }
  };

  const toggleMicrophone = async () => {
    try {
      await localParticipant.setMicrophoneEnabled(!isMicrophoneEnabled);
    } catch (error) {
      console.error("Não foi possível alterar o microfone:", error);
      setNotice("Não foi possível aceder ao microfone.");
      window.setTimeout(() => setNotice(""), 3500);
    }
  };

  const toggleCamera = async () => {
    try {
      await localParticipant.setCameraEnabled(!isCameraEnabled);
      if (audioOnly) setAudioOnly(false);
    } catch (error) {
      console.error("Não foi possível alterar a câmara:", error);
      setNotice("Não foi possível aceder à câmara.");
      window.setTimeout(() => setNotice(""), 3500);
    }
  };

  const toggleAudioOnly = async () => {
    if (audioOnly) {
      setAudioOnly(false);
      if (cameraBeforeAudioOnly) await localParticipant.setCameraEnabled(true);
      return;
    }
    setCameraBeforeAudioOnly(isCameraEnabled);
    setAudioOnly(true);
    if (isCameraEnabled) await localParticipant.setCameraEnabled(false);
  };

  const toggleScreenShare = async () => {
    if (!isScreenShareEnabled && typeof navigator.mediaDevices?.getDisplayMedia !== "function") {
      setNotice("Este navegador não suporta partilha de ecrã. Experimente num navegador de computador atualizado.");
      window.setTimeout(() => setNotice(""), 5000);
      return;
    }

    try {
      await localParticipant.setScreenShareEnabled(!isScreenShareEnabled);
    } catch (error) {
      console.error("Não foi possível partilhar o ecrã:", error);
      const message = error?.name === "NotAllowedError"
        ? "A permissão para partilhar o ecrã foi negada ou a seleção foi cancelada."
        : error?.message || "Verifique as permissões e tente novamente.";
      setNotice(`Não foi possível partilhar o ecrã. ${message}`);
      window.setTimeout(() => setNotice(""), 5000);
    }
  };

  const toggleHand = () => {
    const raised = !handRaised[localParticipant.identity];
    setHandRaised((current) => ({ ...current, [localParticipant.identity]: raised }));
    void enviarControlo({ type: "hand", raised });
  };

  const sendReaction = (emoji) => {
    const reaction = {
      id: `${Date.now()}-${Math.random()}`,
      emoji,
      name: localParticipant.name || localParticipant.identity || "Tu",
    };
    setReactions((current) => [...current, reaction]);
    window.setTimeout(() => {
      setReactions((current) => current.filter((item) => item.id !== reaction.id));
    }, 3600);
    void enviarControlo({ type: "reaction", emoji });
    setReactionMenuOpen(false);
  };

  const toggleFullscreen = async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await meetingRef.current?.requestFullscreen();
    } catch (error) {
      console.error("Não foi possível alternar o ecrã inteiro:", error);
    }
  };

  const sortedTracks = [...cameraTracks].sort((first, second) => {
    if (first.participant.isLocal) return -1;
    if (second.participant.isLocal) return 1;
    return (first.participant.name || first.participant.identity)
      .localeCompare(second.participant.name || second.participant.identity);
  });

  return (
    <div className={`sunset-meeting${chatOpen ? " has-chat" : ""}`} ref={meetingRef}>
      <RoomAudioRenderer />
      <header className="sunset-header">
        <div className="sunset-brand">
          <span className="sunset-live-dot" />
          <div>
            <strong>Ancora Live</strong>
            <span>{nomeTurma || "Sala da turma"}</span>
          </div>
        </div>
        <div className="sunset-meeting-status">
          <span className="sunset-count">♧ {participants.length}</span>
          <span className="sunset-duration">{formatarDuracao(elapsedSeconds)}</span>
        </div>
      </header>

      <main className={`sunset-main${screenTracks.length ? " has-screen-share" : ""}`}>
        <section className="sunset-stage" aria-label="Participantes da chamada">
          {screenTracks.length > 0 && (
            <div className="sunset-screen-shares">
              {screenTracks.map((trackRef) => (
                <article className="sunset-shared-screen" key={`${trackRef.participant.identity}-screen`}>
                  <VideoTrack trackRef={trackRef} />
                  <span>{trackRef.participant.name || trackRef.participant.identity} está a partilhar o ecrã</span>
                </article>
              ))}
            </div>
          )}
          <div className="sunset-photo-grid">
            {sortedTracks.map((trackRef) => (
              <ParticipantPhoto
                key={`${trackRef.participant.identity}-camera`}
                trackRef={trackRef}
                audioOnly={audioOnly}
                handRaised={handRaised[trackRef.participant.identity]}
              />
            ))}
          </div>
          {sortedTracks.length === 0 && (
            <div className="sunset-empty-state">À espera dos participantes...</div>
          )}
        </section>

        {chatOpen && <ChatPanel participants={participants} onClose={() => setChatOpen(false)} />}
      </main>

      <div className="sunset-reaction-layer" aria-live="polite">
        {reactions.map((reaction) => (
          <span className="sunset-floating-reaction" key={reaction.id}>
            {reaction.emoji}<small>{reaction.name}</small>
          </span>
        ))}
      </div>
      {notice && <div className="sunset-notice" role="status">{notice}</div>}
      <footer className="sunset-footer">
        <div className="sunset-toolbar" aria-label="Controlos da chamada">
          <button type="button" className={`sunset-control${isMicrophoneEnabled ? " is-active" : " is-off"}`} onClick={() => void toggleMicrophone()} aria-label={isMicrophoneEnabled ? "Silenciar microfone" : "Ativar microfone"} aria-pressed={!isMicrophoneEnabled} title={isMicrophoneEnabled ? "Silenciar microfone" : "Ativar microfone"}>
            {isMicrophoneEnabled ? "🎤" : "🎙️"}
          </button>
          <button type="button" className={`sunset-control${isCameraEnabled ? " is-active" : " is-off"}`} onClick={() => void toggleCamera()} aria-label={isCameraEnabled ? "Desligar câmara" : "Ligar câmara"} aria-pressed={!isCameraEnabled} title={isCameraEnabled ? "Desligar câmara" : "Ligar câmara"}>
            {isCameraEnabled ? "🎥" : "📷"}
          </button>
          <button type="button" className={`sunset-control${audioOnly ? " is-selected" : ""}`} onClick={() => void toggleAudioOnly()} aria-label={audioOnly ? "Voltar ao modo de vídeo" : "Usar modo só áudio"} aria-pressed={audioOnly} title={audioOnly ? "Voltar ao modo de vídeo" : "Usar modo só áudio"}>🎧</button>
          <button type="button" className={`sunset-control${isScreenShareEnabled ? " is-selected" : ""}`} onClick={() => void toggleScreenShare()} aria-label={isScreenShareEnabled ? "Parar partilha de ecrã" : "Partilhar ecrã"} aria-pressed={isScreenShareEnabled} title={isScreenShareEnabled ? "Parar partilha de ecrã" : "Partilhar ecrã"}>▣</button>
          <button type="button" className={`sunset-control${handRaised[localParticipant.identity] ? " is-selected" : ""}`} onClick={toggleHand} aria-label={handRaised[localParticipant.identity] ? "Baixar a mão" : "Levantar a mão"} aria-pressed={Boolean(handRaised[localParticipant.identity])} title={handRaised[localParticipant.identity] ? "Baixar a mão" : "Levantar a mão"}>✋</button>
          <div className="sunset-reaction-control">
            <button type="button" className={`sunset-control${reactionMenuOpen ? " is-selected" : ""}`} onClick={() => setReactionMenuOpen((open) => !open)} aria-label="Enviar reação" aria-expanded={reactionMenuOpen} title="Enviar reação">☺</button>
            {reactionMenuOpen && (
              <div className="sunset-reaction-menu" role="group" aria-label="Escolher reação">
                {REACTION_EMOJIS.map((emoji) => (
                  <button type="button" key={emoji} onClick={() => sendReaction(emoji)} aria-label={`Enviar ${emoji}`}>{emoji}</button>
                ))}
              </div>
            )}
          </div>
          <button type="button" className={`sunset-control${chatOpen ? " is-selected" : ""}`} onClick={() => setChatOpen((open) => !open)} aria-label={chatOpen ? "Fechar chat" : "Abrir chat"} aria-pressed={chatOpen} title={chatOpen ? "Fechar chat" : "Abrir chat"}>▤</button>
          <button type="button" className="sunset-control" onClick={() => void toggleFullscreen()} aria-label="Alternar ecrã inteiro" title="Ecrã inteiro">⛶</button>
          <button type="button" className="sunset-control sunset-control-end" onClick={onLeave} aria-label="Sair da chamada" title="Sair da chamada">☎</button>
        </div>
      </footer>
    </div>
  );
}