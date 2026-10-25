import { useEffect, useEffectEvent, useRef, useState } from "react";
import "./css/ConteinerRightLive.css";
import LightRays from './js/menuMobileAgendarLiveBackgroung.jsx';
import { Conteiner_Chamada_Grupo } from "./ConteinerRightLive.js";
import "@livekit/components-styles";

import {
  LiveKitRoom,
  VideoConference,
  StartAudio,
} from "@livekit/components-react";
import { Room } from "livekit-client";

import { useUserStore } from "../../../useUseSotore";

export default function ConteinerRightLive({ roomName, nome_Turma, id_admin_turma }) {
  
  const { urlBancoDeDados, dadosUsuario, socket, set_estado_conteiner_live } = useUserStore();

  const [token, setToken] = useState(null);
  const [serverUrl, setServerUrl] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const [room] = useState(() => new Room());
  const intentionalLeave = useRef(false);


  const joinLive = useEffectEvent(async () => {
    if (!roomName || !dadosUsuario?.nome || dadosUsuario?.id == null) {
      setError("Faltam informações da sala ou do usuário");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const role = String(dadosUsuario?.role ?? "").toLowerCase();
      const isTeacher = ["teacher", "professor", "admin", "administrador"].includes(role)
        || (id_admin_turma != null && String(id_admin_turma) === String(dadosUsuario?.id));

      const response = await fetch(`${urlBancoDeDados}/api/livekit/token`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomName: roomName,
          participantName: dadosUsuario.nome,
          participantId: dadosUsuario.id,
          isTeacher
        }),
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.error || "Erro ao gerar token");
      if (intentionalLeave.current) return;

      intentionalLeave.current = false;
      setToken(data.token);
      setServerUrl(data.serverUrl);
      setIsConnected(true);

      void Conteiner_Chamada_Grupo(roomName).then((resultadoChamada) => {
        if (!resultadoChamada?.ok) {
          console.error("A live iniciou, mas a chamada da turma não foi confirmada:", resultadoChamada?.erro);
        } else if (!resultadoChamada.ignorada) {
          console.info(
            `Chamada enviada para ${resultadoChamada.alunos_notificados} aluno(s); `
            + `${resultadoChamada.alunos_online} conectado(s) em tempo real.`
          );
        }
      });
    } catch (err) {
      console.error(err);
      setError(err.message || "Erro ao conectar");
    } finally {
      setLoading(false);
    }
  });

  useEffect(() => {
    if (roomName) void joinLive();
  }, [roomName, retryCount]);

  const leaveRoom = async () => {
    intentionalLeave.current = true;
    if (socket?.connected && roomName) {
      socket.emit("sair_live_turma", { sala: roomName });
    }
    try {
      await room.disconnect(true);
    } catch (err) {
      console.error("Erro ao desconectar da live:", err);
    } finally {
      setToken(null);
      setServerUrl(null);
      setIsConnected(false);
      setError(null);
      set_estado_conteiner_live(false);
    }
  };

  const handleDisconnected = () => {
    if (intentionalLeave.current) return;
    if (socket?.connected && roomName) {
      socket.emit("sair_live_turma", { sala: roomName });
    }
    setToken(null);
    setServerUrl(null);
    setIsConnected(false);
    setError("A conexão com a live foi interrompida. Tente conectar novamente.");
  };

  const handleLiveKitError = (err) => {
    console.error("Erro ao conectar ou publicar mídia na live:", err);
    setToken(null);
    setServerUrl(null);
    setIsConnected(false);
    setError(`Não foi possível iniciar áudio/vídeo: ${err.message || "verifique a conexão e as permissões do dispositivo."}`);
  };

  const handleMediaDeviceFailure = (failure, kind) => {
    console.error(`Falha no dispositivo de mídia (${kind || "desconhecido"}):`, failure);
    const device = kind === "audioinput" ? "microfone" : kind === "videoinput" ? "câmera" : "dispositivo de áudio/vídeo";
    setToken(null);
    setServerUrl(null);
    setIsConnected(false);
    setError(`Não foi possível acessar o ${device}. Verifique as permissões do navegador e tente novamente.`);
  };

  return (
    <div className="ConteinerRightLive">
        <LightRays
          raysOrigin="top-center"
          raysColor="#ffffff"
          raysSpeed={1}
          lightSpread={0.5}
          rayLength={3}
          followMouse={true}
          mouseInfluence={0.1}
          noiseAmount={0}
          distortion={0}
          className="custom-rays"
          pulsating={false}
          fadeDistance={1}
          saturation={1}
      />
      <div className="ConteudoLive">
      <div className="ConteinerRightLiveMenuTop">
        <div className="ConteinerRightLiveMenuTopBox">
            <h3>
                Ancora Live
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-broadcast" viewBox="0 0 16 16">
                <path d="M3.05 3.05a7 7 0 0 0 0 9.9.5.5 0 0 1-.707.707 8 8 0 0 1 0-11.314.5.5 0 0 1 .707.707m2.122 2.122a4 4 0 0 0 0 5.656.5.5 0 1 1-.708.708 5 5 0 0 1 0-7.072.5.5 0 0 1 .708.708m5.656-.708a.5.5 0 0 1 .708 0 5 5 0 0 1 0 7.072.5.5 0 1 1-.708-.708 4 4 0 0 0 0-5.656.5.5 0 0 1 0-.708m2.122-2.12a.5.5 0 0 1 .707 0 8 8 0 0 1 0 11.313.5.5 0 0 1-.707-.707 7 7 0 0 0 0-9.9.5.5 0 0 1 0-.707zM10 8a2 2 0 1 1-4 0 2 2 0 0 1 4 0"/>
                </svg>
            </h3>
        </div>
        <div className="ConteinerRightLiveMenuTopBox">
            <b>Curso</b>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-arrow-right-short" viewBox="0 0 16 16">
            <path fill-rule="evenodd" d="M4 8a.5.5 0 0 1 .5-.5h5.793L8.146 5.354a.5.5 0 1 1 .708-.708l3 3a.5.5 0 0 1 0 .708l-3 3a.5.5 0 0 1-.708-.708L10.293 8.5H4.5A.5.5 0 0 1 4 8"/>
          </svg>
            <li> {nome_Turma} </li>
        </div>
        <div className="widgwtSairSalaLive" onClick={() => void leaveRoom()}>
          Sair da sala
        </div>
      </div>

      {!isConnected ? (
        <div className="join-live-area janela" style={{
          height: "80vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "20px",
        
        }}>
          <h2>
             <b>Videoconferência ao Vivo</b>
             <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-camera-video-fill" viewBox="0 0 16 16">
            <path fill-rule="evenodd" d="M0 5a2 2 0 0 1 2-2h7.5a2 2 0 0 1 1.983 1.738l3.11-1.382A1 1 0 0 1 16 4.269v7.462a1 1 0 0 1-1.406.913l-3.111-1.382A2 2 0 0 1 9.5 13H2a2 2 0 0 1-2-2z"/>
          </svg>
            </h2>
          <p>
            Sala
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-arrow-right" viewBox="0 0 16 16">
            <path fill-rule="evenodd" d="M1 8a.5.5 0 0 1 .5-.5h11.793l-3.147-3.146a.5.5 0 0 1 .708-.708l4 4a.5.5 0 0 1 0 .708l-4 4a.5.5 0 0 1-.708-.708L13.293 8.5H1.5A.5.5 0 0 1 1 8"/>
           </svg>
            {nome_Turma}
          </p>
          {error && <p style={{ color: "red" }}>{error}</p>}
          <button onClick={() => setRetryCount((count) => count + 1)} disabled={loading} className="btn-enter-live">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-camera-video-fill" viewBox="0 0 16 16">
                <path fill-rule="evenodd" d="M0 5a2 2 0 0 1 2-2h7.5a2 2 0 0 1 1.983 1.738l3.11-1.382A1 1 0 0 1 16 4.269v7.462a1 1 0 0 1-1.406.913l-3.111-1.382A2 2 0 0 1 9.5 13H2a2 2 0 0 1-2-2z"/>
              </svg>
                {loading ? "Conectando..." : error ? "Tentar novamente" : "Conectar à Live"}

          </button>
        </div>
      ) : (
        <LiveKitRoom
          room={room}
          token={token}
          serverUrl={serverUrl}
          connect={true}
          video={true}
          audio={true}
          onConnected={() => {
            if (socket?.connected) {
              socket.emit("entrar_live_turma", { sala: roomName }, (resultado) => {
                if (!resultado?.ok) {
                  console.error("Não foi possível registar a entrada na sala da live:", resultado?.erro);
                }
              });
            }
          }}
          onDisconnected={handleDisconnected}
          onError={handleLiveKitError}
          onMediaDeviceFailure={handleMediaDeviceFailure}
          style={{ height: "calc(100vh - 85px)" }}
          data-lk-theme="default"
        >
          <StartAudio label="Ativar áudio da turma" />
          <VideoConference />
        </LiveKitRoom>
      )}
      </div>
    </div>
  );
}