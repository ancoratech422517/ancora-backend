import { useEffect, useRef, useState, useCallback } from "react";
import "./css/ConteinerRightWindowMenssage.css";
import ConteinerRightDadosWindowMenssageMim from "./conteinerRightDadosWindowMenssageMim";
import ConteinerRightDadosWindowMenssageEle from "./ConteinerRightDadosWindowMenssageEle";
import { useUserStore } from "../../../useUseSotore";
import Loading2 from "../../components/conteinerComponentesJsx/loading.2";
import CheckOne from "../../components/conteinerSvg/chcke_one";
import CheckTwo from "../../components/conteinerSvg/check_two";
import Loading3 from "../../components/conteinerComponentesJsx/loading3";
// Função para gerar as iniciais
const getInitials = (nome) => {
  if (!nome || typeof nome !== "string") return "?";
  return nome
    .trim()
    .split(" ")
    .map((palavra) => palavra[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
};

// Função para pegar a cor principal do gradiente
const getMainColorForId = (id) => {
  const coresBase = [
    ["var(--chat-identity-1)", "var(--chat-identity-2)"],
    ["var(--chat-identity-3)", "var(--chat-identity-4)"],
    ["var(--chat-identity-5)", "var(--chat-identity-6)"],
    ["var(--chat-identity-7)", "var(--chat-identity-8)"]
  ];
  const index = Math.abs(Number(id) || 0) % coresBase.length;
  return coresBase[index][0];
};

// --- LOGICA DE STATUS ---
const StatusVisualizacao = ({ lida, statusAmigo, isAudio = false }) => {
  const foiLido = lida === true || String(lida).toLowerCase() === "true" || lida === 1;
  const amigoEstaOnline = statusAmigo === "online";

  const corVerdeClaro = "var(--status-read)";
  const corCinza = isAudio ? "var(--media-player-muted)" : "var(--text-muted)";

  if (foiLido) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', marginLeft: '5px' }}>
        <svg style={{ color: corVerdeClaro, width: 18, height: 18 }} xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-check-all" viewBox="0 0 16 16">
          <path d="M8.97 4.97a.75.75 0 0 1 1.07 1.05l-3.99 4.99a.75.75 0 0 1-1.08.02L2.324 8.384a.75.75 0 1 1 1.06-1.06l2.094 2.093L8.95 4.992zm-.92 5.14.92.92a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 1 0-1.091-1.028L9.477 9.417l-.485-.486z"/>
        </svg>
      </div>
    );
  }

  if (amigoEstaOnline) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', marginLeft: '5px' }}>
        <svg style={{ color: corCinza, width: 18, height: 18 }} xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-check-all" viewBox="0 0 16 16">
          <path d="M8.97 4.97a.75.75 0 0 1 1.07 1.05l-3.99 4.99a.75.75 0 0 1-1.08.02L2.324 8.384a.75.75 0 1 1 1.06-1.06l2.094 2.093L8.95 4.992zm-.92 5.14.92.92a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 1 0-1.091-1.028L9.477 9.417l-.485-.486z"/>
        </svg>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', marginLeft: '5px' }}>
      <svg style={{ color: "var(--text-muted)", width: 18, height: 18 }} xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-check" viewBox="0 0 16 16">
        <path d="M10.97 4.97a.75.75 0 0 1 1.07 1.05l-3.99 4.99a.75.75 0 0 1-1.08.02L4.324 8.384a.75.75 0 1 1 1.06-1.06l2.094 2.093 3.473-4.425z"/>
      </svg>
    </div>
  );
};

// --- PLAYER DE ÁUDIO --- (mantido exatamente igual)
// --- PLAYER DE ÁUDIO — ONDAS DUPLAS ---
const PlayerAudioCustomizado = ({ src, isMyMessage = false, currentlyPlayingSrc, onPlayStart, onPlayStop, containerBgOverride = null }) => {
  const [progresso, setProgresso] = useState(0); // 0–1
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const audioRef = useRef(null);
  const trackRef = useRef(null);

  const isPlaying = currentlyPlayingSrc === src;

  // Cores (adaptadas ao teu chat)-
  const c = isMyMessage ? "var(--chat-audio-own-accent)" : "var(--chat-audio-other-accent)";
  const d = isMyMessage ? "var(--chat-audio-own-wave)" : "var(--chat-audio-other-wave)";
  const c2 = "var(--media-player-track)";
  const d2 = "var(--media-player-overlay)";
  const textColor = isMyMessage ? "var(--chat-message-own-text)" : "var(--chat-message-other-text)";

  // Paths das ondas duplas (mesmo do teu HTML)
  const wavePath = (amp) =>
    `M0 15Q12.5 ${15 - amp} 25 15` +
    Array.from({ length: 9 }, (_, k) => `T${50 + 25 * k} 15`).join("");

  const pathMain = wavePath(15);
  const pathSec = wavePath(-9);

  const formatTime = (time) => {
    if (!time || isNaN(time)) return "0:00";
    const min = Math.floor(time / 60);
    const seg = Math.floor(time % 60);
    return `${min}:${seg < 10 ? "0" : ""}${seg}`;
  };

  const alternarPlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      onPlayStop();
    } else {
      audioRef.current.play().catch(() => {});
      onPlayStart(src, audioRef.current);
    }
  };

  const atualizarProgresso = () => {
    if (!audioRef.current) return;
    const current = audioRef.current.currentTime;
    const dur = audioRef.current.duration || 0;
    setCurrentTime(current);
    setProgresso(isFinite(dur) && dur > 0 ? current / dur : 0);
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      const dur = audioRef.current.duration;
      setDuration(isFinite(dur) ? dur : 0);
    }
  };

  const seekFromClientX = (clientX) => {
    if (!trackRef.current || !audioRef.current?.duration) return;
    const rect = trackRef.current.getBoundingClientRect();
    const p = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    audioRef.current.currentTime = p * audioRef.current.duration;
    setProgresso(p);
    setCurrentTime(audioRef.current.currentTime);
  };

  const handleSeekClick = (e) => seekFromClientX(e.clientX);

  const handleDragStart = (e) => {
    setIsDragging(true);
    const clientX = e.clientX || e.touches?.[0]?.clientX;
    if (clientX != null) seekFromClientX(clientX);
  };

  const handleDragMove = (e) => {
    if (!isDragging) return;
    const clientX = e.clientX || e.touches?.[0]?.clientX;
    if (clientX != null) seekFromClientX(clientX);
  };

  const handleDragEnd = () => setIsDragging(false);

  useEffect(() => {
    if (!isDragging) return;
    document.addEventListener("mousemove", handleDragMove);
    document.addEventListener("mouseup", handleDragEnd);
    document.addEventListener("touchmove", handleDragMove, { passive: true });
    document.addEventListener("touchend", handleDragEnd);
    return () => {
      document.removeEventListener("mousemove", handleDragMove);
      document.removeEventListener("mouseup", handleDragEnd);
      document.removeEventListener("touchmove", handleDragMove);
      document.removeEventListener("touchend", handleDragEnd);
    };
  }, [isDragging]);

  const displayTime =
    isPlaying || currentTime > 0
      ? formatTime(currentTime)
      : formatTime(duration || 0);

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "12px",
        minWidth: "270px",
        color: c,
        position: "relative",
        marginRight:"3%",
        paddingRight:"4%"
      }}
    >
      <audio
        ref={audioRef}
        src={src}
        preload="metadata"
        onTimeUpdate={atualizarProgresso}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={() => {
          onPlayStop();
          setProgresso(0);
          setCurrentTime(0);
        }}
      />

      {/* Botão play/pause */}
      <button
        type="button"
        onClick={alternarPlay}
        aria-label={isPlaying ? "Pausar" : "Reproduzir"}
        style={{
          cursor: "pointer",
          width: 38,
          height: 38,
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          border: `2px solid ${c}`,
          color: c,
          background: "transparent",
          padding: 0,
          boxSizing: "border-box",
        }}
      >
        {isPlaying ? (
          <span
            style={{
              display: "block",
              width: 12,
              height: 14,
              background: `linear-gradient(90deg, ${c} 36%, transparent 36% 64%, ${c} 64%)`,
            }}
          />
        ) : (
          <span
            style={{
              display: "block",
              width: 0,
              height: 0,
              marginLeft: 3,
              borderStyle: "solid",
              borderWidth: "7px 0 7px 11px",
              borderColor: `transparent transparent transparent ${c}`,
            }}
          />
        )}
      </button>

      {/* Track — ondas duplas SVG */}
      <div
        ref={trackRef}
        onClick={handleSeekClick}
        onMouseDown={handleDragStart}
        onTouchStart={handleDragStart}
        style={{
          flex: 1,
          height: 50,
          cursor: "pointer",
          position: "relative",
          userSelect: "none",
          touchAction: "none",
        }}
      >
        {/* Onda base (inativa) */}
        <svg
          viewBox="0 0 200 30"
          preserveAspectRatio="none"
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            overflow: "hidden",
          }}
        >
          <path
            d={pathMain}
            fill="none"
            stroke={d}
            strokeWidth={3}
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
            style={
              isPlaying
                ? { animation: "audioDwWave 1s linear infinite" }
                : undefined
            }
          />
          <path
            d={pathSec}
            fill="none"
            stroke={d2}
            strokeWidth={1.6}
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
            style={
              isPlaying
                ? {
                    animation: "audioDwWave 1.7s linear infinite reverse",
                  }
                : undefined
            }
          />
        </svg>

        {/* Onda ativa (progresso com clip) */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            clipPath: `inset(0 ${((1 - progresso) * 100).toFixed(3)}% 0 0)`,
            pointerEvents: "none",
          }}
        >
          <svg
            viewBox="0 0 200 30"
            preserveAspectRatio="none"
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              overflow: "hidden",
            }}
          >
            <path
              d={pathMain}
              fill="none"
              stroke={c}
              strokeWidth={3}
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
              style={
                isPlaying
                  ? { animation: "audioDwWave 1s linear infinite" }
                  : undefined
              }
            />
            <path
              d={pathSec}
              fill="none"
              stroke={c2}
              strokeWidth={1.6}
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
              style={
                isPlaying
                  ? {
                      animation: "audioDwWave 1.7s linear infinite reverse",
                    }
                  : undefined
              }
            />
          </svg>
        </div>
      </div>

      {/* Tempo */}
      <span
        style={{
          font: "600 12px ui-monospace, Menlo, monospace",
          minWidth: 34,
          textAlign: "right",
          color: textColor,
          flexShrink: 0,
        }}
      >
        {displayTime}
      </span>

      <style>
        {`
          @keyframes audioDwWave {
            to { transform: translateX(-50px); }
          }
          @media (prefers-reduced-motion: reduce) {
            .pl path { animation: none !important; }
          }
        `}
      </style>
    </div>
  );
};
// ====================== PLAYER DE VÍDEO - ATUALIZADO ======================
const PlayerVideoCustomizado = ({
  videoUrl,
  fileName = "vídeo.mp4",
  fileSize = 0,
  isMine = false,
  onViewed
}) => {
  const videoRef = useRef(null);
  const containerRef = useRef(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [totalDuration, setTotalDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [progress, setProgress] = useState(0);
  const [showMenu, setShowMenu] = useState(false);

const formatTime = (time) => {
  if (!time || !isFinite(time) || isNaN(time)) return "0:00";
  const min = Math.floor(time / 60);
  const seg = Math.floor(time % 60);
  return `${min}:${seg < 10 ? "0" : ""}${seg}`;
};

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    setCurrentTime(video.currentTime);
    setProgress((video.currentTime / video.duration) * 100);
  };

  const handleLoadedMetadata = () => {
    if (!videoRef.current) return;
    setTotalDuration(videoRef.current.duration);
  };

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
    } else {
      video.play();
      if (onViewed) onViewed();
    }
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (e) => {
    const video = videoRef.current;
    if (!video) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    video.currentTime = percent * video.duration;
  };

  const changeSpeed = (speed) => {
    const video = videoRef.current;
    if (video) {
      video.playbackRate = speed;
      setPlaybackSpeed(speed);
    }
  };

  const toggleFullscreen = () => {
    const container = containerRef.current;
    if (!container) return;
    if (!document.fullscreenElement) {
      container.requestFullscreen?.() || container.webkitRequestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
    setShowMenu(false);
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (video) {
      video.muted = !video.muted;
      setIsMuted(!isMuted);
    }
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setShowMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div
      ref={containerRef}
      style={{
        maxWidth: "380px",
        borderRadius: "22px",
        overflow: "hidden",
        boxShadow: "var(--shadow-lg)",
        background: "var(--media-player-bg)",
        position: "relative",
        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
      }}
    >
      <div 
        style={{ position: "relative", background: "var(--surface-deep)" }}
        onClick={togglePlay}
      >
        <video
          ref={videoRef}
          src={videoUrl}
          muted={isMuted}
          playsInline
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onEnded={() => setIsPlaying(false)}
          style={{
            width: "100%",
            display: "block",
            aspectRatio: "16 / 9",
            objectFit: "cover",
            transition: "filter 0.4s ease",
            filter: isPlaying ? "none" : "brightness(0.85)",
            cursor: "pointer"
          }}
        />

        {!isPlaying && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "var(--media-player-overlay)",
              zIndex: 2,
            }}
          >
            <div
              style={{
                width: "72px",
                height: "72px",
                background: "linear-gradient(90deg, var(--media-player-accent-cyan), var(--media-player-accent))",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 0 40px var(--media-player-accent)",
                animation: "pulsePlay 2s infinite",
              }}
            >
              <svg width="34" height="34" viewBox="0 0 24 24" fill="var(--media-player-bg)">
                <path d="M8 5.14v14.72c0 .85 1.03 1.27 1.64.84l11-7.36c.6-.4.6-1.28 0-1.68L9.64 4.3c-.61-.43-1.64-.01-1.64.84z" />
              </svg>
            </div>
          </div>
        )}

        {totalDuration > 0 && !isPlaying && (
          <div
            style={{
              position: "absolute",
              bottom: "12px",
              right: "12px",
              background: "var(--media-player-control)",
              color: "var(--media-player-text)",
              fontSize: "13px",
              fontFamily: "SF Mono, monospace",
              padding: "3px 9px",
              borderRadius: "9999px",
              zIndex: 3,
              boxShadow: "var(--shadow-md)",
            }}
          >
            {formatTime(totalDuration)}
          </div>
        )}

        <button
          onClick={(e) => { e.stopPropagation(); toggleFullscreen(); }}
          style={{
            position: "absolute",
            top: "12px",
            right: "56px",
            background: "var(--media-player-control)",
            border: "none",
            color: "var(--media-player-text)",
            width: "36px",
            height: "36px",
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "18px",
            zIndex: 21,
            cursor: "pointer",
            boxShadow: "var(--shadow-sm)",
          }}
          title="Ecrã inteiro"
        >
          ⛶
        </button>

        <button
          onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }}
          style={{
            position: "absolute",
            top: "12px",
            right: "12px",
            background: "var(--media-player-control)",
            border: "none",
            color: "var(--media-player-text)",
            width: "36px",
            height: "36px",
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "20px",
            zIndex: 20,
            cursor: "pointer",
            boxShadow: "var(--shadow-sm)",
          }}
        >
          ⋮
        </button>
      </div>

      {showMenu && (
        <div className="videoMenuContainer">
          <div style={{ marginBottom: "20px" }}>
            <div
              style={{ height: "6px", background: "var(--media-player-track)", borderRadius: "9999px", position: "relative", cursor: "pointer" }}
              onClick={handleSeek}
            >
              <div
                style={{
                  width: `${progress}%`,
                  height: "100%",
                  background: "linear-gradient(90deg, var(--media-player-accent-cyan), var(--media-player-accent))",
                  borderRadius: "9999px"
                }}
              />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: "6px", fontSize: "13px", color: "var(--media-player-muted)" }}>
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(totalDuration)}</span>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <button 
              onClick={togglePlay} 
              style={{ background: "transparent", border: "none", color: "var(--media-player-text)", padding: "12px 14px", borderRadius: "10px", textAlign: "left", display: "flex", alignItems: "center", gap: "12px", width: "100%" }}
            >
              {isPlaying ? "⏸️ Pausar" : "▶️ Reproduzir"}
            </button>

            <button 
              onClick={toggleMute} 
              style={{ background: "transparent", border: "none", color: "var(--media-player-text)", padding: "12px 14px", borderRadius: "10px", textAlign: "left", display: "flex", alignItems: "center", gap: "12px", width: "100%" }}
            >
              {isMuted ? "🔊 Ativar som" : "🔇 Silenciar"}
            </button>

            <div style={{ padding: "10px 14px", color: "var(--media-player-subtle)" }}>
              Velocidade
              <div style={{ display: "flex", gap: "6px", marginTop: "8px", flexWrap: "wrap" }}>
                {[0.5, 1, 1.5, 2].map((speed) => (
                  <button
                    key={speed}
                    onClick={() => changeSpeed(speed)}
                    style={{
                      flex: "1 1 auto",
                      padding: "8px 12px",
                      borderRadius: "8px",
                      background: playbackSpeed === speed ? "var(--media-player-accent)" : "var(--media-player-track)",
                      color: playbackSpeed === speed ? "var(--surface-deep)" : "var(--media-player-text)",
                      border: "none",
                      fontWeight: "600",
                      fontSize: "13px"
                    }}
                  >
                    {speed}x
                  </button>
                ))}
              </div>
            </div>

            <button 
              onClick={toggleFullscreen} 
              style={{ background: "transparent", border: "none", color: "var(--media-player-text)", padding: "12px 14px", borderRadius: "10px", textAlign: "left", display: "flex", alignItems: "center", gap: "12px", width: "100%" }}
            >
              ⛶ Ecrã inteiro
            </button>
          </div>
        </div>
      )}

      <div
        style={{
          padding: "10px 16px",
          fontSize: "13.5px",
          color: "var(--media-player-muted)",
          display: "flex",
          alignItems: "center",
          gap: "8px",
          background: "var(--media-player-bg)",
        }}
      >
        <span>🎥</span>
        <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {fileName}
        </span>
        {fileSize > 0 && <span style={{ fontFamily: "SF Mono" }}>{(fileSize / (1024 * 1024)).toFixed(1)} MB</span>}
      </div>

      <style>
        {`
          @keyframes pulsePlay {
            0% { transform: scale(1); }
            50% { transform: scale(1.15); }
            100% { transform: scale(1); }
          }
        `}
      </style>
    </div>
  );
};

// ====================== RESTO DO COMPONENTE ======================
export default function ConteinerRightWindowMenssage() {
  const { 
    socket, 
    menssagens, 
    setMenssagem, 
    setMenssagensAntigas, 
    ChatAtivo, 
    dadosUsuario, 
    tocarSomRecebido, 
    digitandoStatus, 
    gravandoAudioStatus,
    amigos,
    urlBancoDeDados,
    setProdutoUsuarioChat
  } = useUserStore();
  
  const scrollRef = useRef(null);
  const amigoEstaDigitando = digitandoStatus[ChatAtivo?.id_amigo];
  const amigoEstaGravandoAudio = gravandoAudioStatus?.[ChatAtivo?.id_amigo] || false;

  const [currentlyPlayingSrc, setCurrentlyPlayingSrc] = useState(null);
  const activeAudioRef = useRef(null);

  const [modalImage, setModalImage] = useState(null);

  const handlePlayStart = useCallback((src, audioElement) => {
    if (activeAudioRef.current && activeAudioRef.current !== audioElement) activeAudioRef.current.pause();
    activeAudioRef.current = audioElement;
    setCurrentlyPlayingSrc(src);
  }, []);

  const handlePlayStop = useCallback(() => {
    activeAudioRef.current = null;
    setCurrentlyPlayingSrc(null);
  }, []);

  const statusAmigoAtual = amigos.find(
    (amigo) => String(amigo.id_amigo) === String(ChatAtivo?.id_amigo)
  )?.status || "offline";

  useEffect(() => {
    if (!socket) return;

    const tratarMensagemNova = (data) => { 
      const jaExiste = menssagens.some(m => 
        String(m.id_remitente) === String(data.id_remitente) && 
        m.menssagem === data.menssagem
      );
      if (!jaExiste) {
        setMenssagem(data); 
        tocarSomRecebido(); 
      }
    };

    const tratarHistorico = (data) => { 
      if (setMenssagensAntigas) setMenssagensAntigas(data); 
    };

    const tratarProdutosChat = (data) => {
      if (setProdutoUsuarioChat) setProdutoUsuarioChat(data);
    };

    socket.on("receber_menssagem", tratarMensagemNova);
    socket.on("minhas_menssagens", tratarHistorico);
    socket.on("lista_produto_usuario_chat", tratarProdutosChat);

    return () => {
      socket.off("receber_menssagem", tratarMensagemNova);
      socket.off("minhas_menssagens", tratarHistorico);
      socket.off("lista_produto_usuario_chat", tratarProdutosChat);
    };
  }, [socket, setMenssagem, setMenssagensAntigas, tocarSomRecebido, menssagens, setProdutoUsuarioChat]);

  useEffect(() => {
    if (socket && ChatAtivo && menssagens.length > 0) {
      const temMensagemNaoLida = menssagens.some(
        msg => String(msg.id_destinatario) === String(dadosUsuario?.id) && !msg.lida
      );

      if (temMensagemNaoLida) {
        socket.emit("menssagem_visualizada", {
          nossa_sala: ChatAtivo.nossa_sala,
          id_amigo: ChatAtivo.id_amigo,
          id_remitente: dadosUsuario?.id
        });
      }
    }
  }, [ChatAtivo, menssagens, socket, dadosUsuario]);

  useEffect(() => {
    if (socket && ChatAtivo?.nossa_sala) {
      socket.emit("buscar_menssagens", { nossa_sala: ChatAtivo.nossa_sala });
    }
  }, [socket, ChatAtivo]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [menssagens, amigoEstaDigitando]);

  const gerarGradienteElegante = (id) => {
    const coresBase = [
      ["var(--chat-identity-1)", "var(--chat-identity-2)"],
      ["var(--chat-identity-3)", "var(--chat-identity-4)"],
      ["var(--chat-identity-5)", "var(--chat-identity-6)"],
      ["var(--chat-identity-7)", "var(--chat-identity-8)"]
    ];
    const idNumerico = Number(id);
    const indice = Number.isFinite(idNumerico) ? Math.abs(idNumerico) % coresBase.length : 0;
    const parDeCores = coresBase[indice];
    return `linear-gradient(135deg, ${parDeCores[0]}, ${parDeCores[1]})`;
  };

  const formatBytes = (bytes) => {
    const tamanho = Number(bytes);
    if (!Number.isFinite(tamanho) || tamanho <= 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.min(Math.floor(Math.log(tamanho) / Math.log(k)), sizes.length - 1);
    return parseFloat((tamanho / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  const getCloudinaryResourceType = (src) => {
    if (!src) return null;

    try {
      const url = new URL(src, window.location.href);
      if (!url.hostname.endsWith("cloudinary.com")) return null;
      return url.pathname.match(/\/(raw|image|video)\/upload\//)?.[1] || null;
    } catch {
      return null;
    }
  };

  const getDownloadUrl = (src, fileName, resourceType) => {
    if (!src) return src;

    try {
      const url = new URL(src, window.location.href);
      if (!url.hostname.endsWith("cloudinary.com") || !url.pathname.includes("/upload/")) {
        return src;
      }

      const actualResourceType = getCloudinaryResourceType(src) || resourceType;
      if (actualResourceType === "raw") {
        return src;
      }

      const safeFileName = (fileName || "arquivo").replace(/[\\/]/g, "_");
      return src.replace("/upload/", `/upload/fl_attachment:${encodeURIComponent(safeFileName)}/`);
    } catch {
      return src;
    }
  };

  const downloadMedia = async (src, fileName, resourceType, fileUrl, publicId) => {
    const sourceFileUrl = fileUrl || src;
    const urlResourceType = getCloudinaryResourceType(sourceFileUrl);
    const isRawFile = urlResourceType ? urlResourceType === "raw" : resourceType === "raw";
    let downloadUrl = getDownloadUrl(src, fileName, resourceType);
    let temporaryUrl = null;

    if (isRawFile && sourceFileUrl) {
      const params = new URLSearchParams({
        file_url: sourceFileUrl,
        public_id: publicId || "",
        filename: fileName || "arquivo"
      });

      try {
        const response = await fetch(`${urlBancoDeDados}/api/download-file?${params.toString()}`);
        if (!response.ok) {
          const error = await response.json().catch(() => ({}));
          throw new Error(error.error || `Falha no download (${response.status})`);
        }
        temporaryUrl = URL.createObjectURL(await response.blob());
        downloadUrl = temporaryUrl;
      } catch (error) {
        console.error("Erro ao baixar anexo:", error);
        window.alert(error.message || "Não foi possível baixar o arquivo.");
        return;
      }
    }

    const link = document.createElement("a");
    link.href = downloadUrl;
    link.download = fileName || "arquivo";
    document.body.appendChild(link);
    link.click();
    link.remove();

    if (temporaryUrl) {
      window.setTimeout(() => URL.revokeObjectURL(temporaryUrl), 60_000);
    }
  };

  const renderMediaMessage = (parsed, souEu, blobUrlFromMsg = null) => {
    const { 
      mimeType, 
      fileName, 
      fileSize, 
      fileUrl,      // ← Novo (principal)
      publicId,
      folder,
      resourceType,
      data, 
      filePath 
    } = parsed || {};

    const BACKEND_URL = `${urlBancoDeDados}`;

    // Prioridade: fileUrl (Cloudinary) > blobUrl (preview local) > data > filePath
    let displaySrc = blobUrlFromMsg || fileUrl || data || filePath;

    if (displaySrc && typeof displaySrc === "string") {
      if (!displaySrc.startsWith("http") && !displaySrc.startsWith("data:") && !displaySrc.startsWith("blob:")) {
        displaySrc = `${displaySrc.startsWith("/") ? "" : "/"}${displaySrc}`;
      }
    }

    const bgColor = souEu ? "var(--chat-message-own-bg)" : "var(--chat-message-other-bg)";
    const textColor = souEu ? "var(--chat-message-own-text)" : "var(--chat-message-other-text)";
    const accent = souEu ? "var(--primary)" : "var(--media-player-accent-cyan)";

    // ====================== CARD DE PRODUTO ======================
    if (mimeType === "product/card") {
      // ... (mantém o teu código de produto aqui)
      let product = {};
      try { product = JSON.parse(data || "{}"); } catch (e) {}
      // ... resto do card de produto (não alterei)
    }

    if (!displaySrc || displaySrc === "") {
      return (
        <div style={{
          padding: "20px 24px",
          background: bgColor,
          borderRadius: "18px",
          border: "2px dashed var(--status-danger)",
          boxShadow: "var(--shadow-md)",
          maxWidth: "360px"
        }}>
          <div style={{display: "flex", alignItems: "center", gap: "14px"}}>
            <div style={{fontSize: "38px"}}>⚠️</div>
            <div style={{flex: 1}}>
              <div style={{fontWeight: "700", fontSize: "15px", color: textColor}}>{fileName || "Ficheiro"}</div>
              <div style={{fontSize: "13px", color: textColor, opacity: 0.8}}>
                {formatBytes(fileSize || 0)} • Erro ao carregar ficheiro
              </div>
            </div>
          </div>
        </div>
      );
    }

    // ====================== IMAGENS ======================
    if (mimeType?.startsWith("image/")) {
        
          return (
        <div 
          onClick={() => setModalImage({ src: displaySrc, name: fileName || "Imagem" })}
          style={{
            borderRadius: "18px",
            overflow: "hidden",
            boxShadow: "var(--shadow-md)",
            background: bgColor,
            padding: "6px",
            maxWidth: "100%",
            cursor: "zoom-in"
          }}
        >
          <img 
            src={displaySrc} 
            alt={fileName || "Imagem"}
            style={{
              width: "100%",
              borderRadius: "14px",
              display: "block",
              maxHeight: "480px",
              objectFit: "contain",
              background: "var(--surface-deep)"
            }}
          />
          {fileName && (
            <div style={{ padding: "8px 12px", fontSize: "13px", color: textColor, opacity: 0.85, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span>{fileName}</span>
              {fileSize && <span>{formatBytes(fileSize)}</span>}
            </div>
          )}
        </div>
      );
    }

    // ====================== VÍDEOS ======================
    if (mimeType?.startsWith("video/") || resourceType === "video") {
      return (
        <PlayerVideoCustomizado
          videoUrl={displaySrc}
          fileName={fileName || "Vídeo"}
          fileSize={fileSize || 0}
          isMine={souEu}
          onViewed={() => {
            if (socket && ChatAtivo && dadosUsuario) {
              socket.emit("menssagem_visualizada", {
                nossa_sala: ChatAtivo.nossa_sala,
                id_amigo: ChatAtivo.id_amigo,
                id_remitente: dadosUsuario.id
              });
            }
          }}
        />
      );
    }

    // ====================== ÁUDIOS ======================
    if (mimeType?.startsWith("audio/")) {
      return (
        <PlayerAudioCustomizado
          src={displaySrc}
          isMyMessage={souEu}
          currentlyPlayingSrc={currentlyPlayingSrc}
          onPlayStart={handlePlayStart}
          onPlayStop={handlePlayStop}
        />
      );
    }

    // ====================== PDF ======================
    if (mimeType === "application/pdf" || fileName?.toLowerCase().endsWith(".pdf")) {
     
      return (

        <div 
          onClick={() => downloadMedia(displaySrc, fileName || "documento.pdf", resourceType, fileUrl, publicId)}
          style={{
            padding: "20px 24px",
            background: bgColor,
            borderRadius: "18px",
            border: `2px dashed ${accent}`,
            display: "flex",
            alignItems: "center",
            gap: "18px",
            maxWidth: "340px",
            cursor: "pointer",
            boxShadow: "var(--shadow-md)",
            transition: "all 0.2s ease"
          }}
          onMouseOver={(e) => { e.currentTarget.style.transform = "translateY(-3px)"; }}
          onMouseOut={(e) => { e.currentTarget.style.transform = "translateY(0)"; }}
        >
          <svg width="52" height="52" viewBox="0 0 24 24" fill={accent}>
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/>
          </svg>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: "700", fontSize: "15.5px", color: textColor }}>{fileName || "Documento PDF"}</div>
            <div style={{ fontSize: "13px", opacity: 0.75, color: textColor }}>{formatBytes(fileSize || 0)}</div>
          </div>
          <span style={{ fontSize: "28px", opacity: 0.6 }}>↓</span>
        </div>
      );
    }

    // ====================== FICHEIRO GENÉRICO ======================
    return (
      <div 
        onClick={() => downloadMedia(displaySrc, fileName || "arquivo", resourceType, fileUrl, publicId)}
        style={{
          padding: "20px 24px",
          background: bgColor,
          borderRadius: "18px",
          display: "flex",
          alignItems: "center",
          gap: "18px",
          maxWidth: "360px",
          cursor: "pointer",
          boxShadow: "var(--shadow-md)",
          transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)"
        }}
        onMouseOver={(e) => { e.currentTarget.style.transform = "translateY(-4px)"; }}
        onMouseOut={(e) => { e.currentTarget.style.transform = "translateY(0)"; }}
      >
        <div style={{ fontSize: "38px", lineHeight: 1 }}>📎</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: "700", fontSize: "15.5px", color: textColor, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {fileName || "Ficheiro"}
          </div>
          <div style={{ fontSize: "13px", opacity: 0.75, color: textColor }}>
            {mimeType} • {formatBytes(fileSize || 0)}
          </div>
        </div>
        <div style={{ fontSize: "26px", opacity: 0.7 }}>↓</div>
      </div>
    );
  };
  const formatarConteudo = (msg, souEu) => {
    const texto = msg?.menssagem;
    if (typeof texto !== 'string') return texto;

    let parsed = {};
    if (texto.startsWith('{') && texto.endsWith('}')) {
      try {
        parsed = JSON.parse(texto) || {};
      } catch (e) {}
    }

    if (parsed.isFile || msg?.file_url) {
      return renderMediaMessage({
        ...parsed,
        isFile: true,
        fileUrl: parsed.fileUrl || msg?.file_url,
        publicId: parsed.publicId || msg?.public_id,
        fileName: parsed.fileName || msg?.file_name,
        mimeType: parsed.mimeType || msg?.mime_type,
        fileSize: parsed.fileSize ?? msg?.file_size
      }, souEu, msg?.blobUrl);
    }

    if (texto.includes("giphy.com")) {
      return renderMediaMessage({ mimeType: "image/gif", data: texto }, souEu);
    }

    return texto;
  };

  const closeModal = () => setModalImage(null);

  const handleDownload = () => {
    if (!modalImage) return;
    const link = document.createElement("a");
    link.href = modalImage.src;
    link.download = modalImage.name;
    link.click();
  };

  return (
    <div className="ConteinerRightWindowMenssage" ref={scrollRef}>
      {menssagens && menssagens.length > 0 ? (
        <>
          {menssagens.map((msg, index) => {
            const souEu = String(msg.id_remitente) === String(dadosUsuario?.id);
            const isAudio = typeof msg.menssagem === 'string' && msg.menssagem.startsWith("data:audio");
            const mensagemOriginal = msg.reply_to_menssagem || msg.mensagemOriginal || msg.conteudoOriginal;
            const nomeOriginal = msg.reply_to_nome || msg.nome_original;

if (isAudio) {
  const meuGradiente = gerarGradienteElegante(msg.id_destinatario || 0);
  const conteudoAudio = (
    <PlayerAudioCustomizado
      src={msg.menssagem}
      isMyMessage={souEu}  // usa a variável souEu
      currentlyPlayingSrc={currentlyPlayingSrc}
      onPlayStart={handlePlayStart}
      onPlayStop={handlePlayStop}
    />
  );

  // Renderiza o componente certo baseado em quem enviou
  return souEu ? (
    <ConteinerRightDadosWindowMenssageMim 
      key={index} 
      texto={conteudoAudio} 
      hora={
        <div style={{display: 'flex', alignItems: 'center', gap: '6px'}}>
          <small style={{ fontSize: '10.5px', opacity: 0.75 }}>
            {msg.data_envio}
          </small>
          <StatusVisualizacao 
            lida={msg.lida} 
            statusAmigo={statusAmigoAtual} 
            isAudio={true} 
          />
        </div>
      } 
      nome={dadosUsuario?.nome || "Você"} 
      fundo={meuGradiente} 
      id={msg.id}
      nossa_sala={msg.nossa_sala}
      id_remitente={msg.id_remitente}
      foto_usuario={ChatAtivo?.foto_usuario}
      mensagemOriginal={mensagemOriginal}
      nomeOriginal={nomeOriginal}
    />
  ) : (
    <ConteinerRightDadosWindowMenssageEle 
      key={index} 
      texto={conteudoAudio} 
      hora={msg.data_envio} 
      nome={msg.nome_remitente} 
      fundo={meuGradiente} 
      id={msg.id}
      nossa_sala={msg.nossa_sala}
      id_remitente={msg.id_remitente}
      foto_amigo={ChatAtivo?.foto_amigo}
      mensagemOriginal={mensagemOriginal}
      nomeOriginal={nomeOriginal}
    />
  );
}           const meuGradiente = gerarGradienteElegante(msg.id_destinatario);
            const conteudoFinal = formatarConteudo(msg, souEu);

            return souEu ? (
              <ConteinerRightDadosWindowMenssageMim 
                key={index} 
                texto={conteudoFinal} 
                hora={
                  <div style={{display: 'flex', alignItems: 'center'}}>
                    {msg.data_envio} 
                    <StatusVisualizacao lida={msg.lida} statusAmigo={statusAmigoAtual} />
                  </div>
                } 
                nome={msg.nome_remitente} 
                fundo={meuGradiente} 
                id={msg.id}
                nossa_sala={msg.nossa_sala}
                id_remitente={msg.id_remitente}
                foto_usuario = {ChatAtivo?.foto_usuario}
                mensagemOriginal={msg.reply_to_menssagem || msg.mensagemOriginal || msg.conteudoOriginal}
                nomeOriginal={msg.reply_to_nome || msg.nome_original}
              />
            ) : (
              <ConteinerRightDadosWindowMenssageEle 
                key={index} 
                texto={conteudoFinal} 
                hora={msg.data_envio} 
                nome={msg.nome_remitente} 
                fundo={meuGradiente} 
                id={msg.id}
                nossa_sala={msg.nossa_sala}
                id_remitente={msg.id_remitente}
                foto_amigo = {ChatAtivo?.foto_amigo}
                mensagemOriginal={msg.reply_to_menssagem || msg.mensagemOriginal || msg.conteudoOriginal}
                nomeOriginal={msg.reply_to_nome || msg.nome_original}
              />
            );
          })}

          {amigoEstaDigitando && (
            <div style={{ alignSelf: 'flex-start', margin: '10px 0' }}>
              <ConteinerRightDadosWindowMenssageEle texto={<Loading2 />} nome={ChatAtivo?.nome_amigo} fundo="var(--chat-message-other-bg)" hora="" foto_amigo = {ChatAtivo?.foto_amigo} />
            </div>
          )}

          {amigoEstaGravandoAudio && (
            <div style={{ alignSelf: 'flex-start', margin: '10px 0' }}>
              <ConteinerRightDadosWindowMenssageEle texto={<Loading2 />} nome={ChatAtivo?.nome_amigo} fundo="var(--chat-message-other-bg)" hora="" />
            </div>
          )}
        </>
      ) : (
        <div className="sem-mensagens">
          <Loading3 />
        </div>
      )}

      {modalImage && (
        <div 
          onClick={closeModal}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "var(--modal-backdrop)",
            zIndex: 99999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
            cursor: "zoom-out"
          }}
        >
          <div 
            onClick={(e) => e.stopImmediatePropagation()}
            style={{
              maxWidth: "95vw",
              maxHeight: "95vh",
              position: "relative",
              borderRadius: "20px",
              overflow: "hidden",
              boxShadow: "var(--shadow-lg)"
            }}
          >
            <img 
              src={modalImage.src} 
              alt={modalImage.name}
              style={{
                maxWidth: "100%",
                maxHeight: "90vh",
                display: "block",
                objectFit: "contain"
              }}
            />

            <div style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              background: "linear-gradient(180deg, var(--modal-header-overlay), transparent)",
              padding: "18px 24px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              color: "var(--media-player-text)"
            }}>
              <span style={{ fontWeight: "700", fontSize: "15.5px" }}>{modalImage.name}</span>
              
              <div style={{ display: "flex", gap: "12px" }}>
                <button 
                  onClick={handleDownload}
                  style={{
                    background: "var(--primary-dark)",
                    color: "var(--text-on-primary)",
                    border: "none",
                    padding: "8px 18px",
                    borderRadius: "9999px",
                    fontWeight: "700",
                    fontSize: "14px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px"
                  }}
                >
                  ⬇ Download
                </button>
                <button 
                  onClick={closeModal}
                  style={{
                    background: "var(--surface-hover)",
                    color: "var(--text-primary)",
                    border: "none",
                    padding: "8px 16px",
                    borderRadius: "9999px",
                    fontSize: "14px",
                    cursor: "pointer"
                  }}
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}