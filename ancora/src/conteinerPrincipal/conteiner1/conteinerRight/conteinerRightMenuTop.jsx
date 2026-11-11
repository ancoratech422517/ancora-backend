import { useState } from "react";
import "./css/ConteinerRightMenuTop.css";
import SetaEsquerda from "../../components/conteinerSvg/setaEsquerda";
import Telefone from "../../components/conteinerSvg/Telefone";
import Store from "../../components/conteinerSvg/store";
import MenuPonto from "../../components/conteinerSvg/menuPonto";
import { useUserStore } from "../../../useUseSotore";
import { Back_home } from "./js/conteinerRightMenuTopAction";
import { MenuMobileRight } from "./js/menuMobile";
import Perfil from "../../../assets/img_fundo_vazio/perfil.png"
import { CHAT_THEMES, DEFAULT_CHAT_THEME } from "./chatThemes";
import { ANIMATED_CHAT_SCENES } from "./animatedChatScenes";
import { iniciarChamadaVoz } from "./voiceCalls";
export default function ConteinerRightMenuTop({
    ativarConteiner,
    chatTheme,
    onSelectChatTheme,
    chatThemeMode,
    animatedScene,
    onSelectAnimatedScene,
    animationPaused,
    onToggleAnimation,
}) {
    // 1. Pegamos ChatAtivo, socket, o array de amigos e o novo estado digitandoStatus
    const { 
        ChatAtivo, 
        socket, 
        amigos, 
        digitandoStatus , 
        setMostrarChat , 
        urlBancoDeDados , 
        setIsMobile,
        dadosUsuario,
        chamadaVozAtiva,
    } = useUserStore();

    // 2. Buscamos o status atualizado diretamente no array de amigos
    const amigoNoEstado = amigos.find(
        (a) => String(a.id_amigo) === String(ChatAtivo?.id_amigo)
    );
    let valor = "none"
    
    const retorno = ()=>{
        if (ChatAtivo?.foto_amigo !== "none"){
            return "ativo"
        }
        else{
            return "none"
        }
    }
    
    const [estadoFotoPerfil , setEstadoFotoPerfil] = useState(retorno())
    const [mostrarTemas, setMostrarTemas] = useState(false)
    const getUrlVideo = (url) => {
      if (!url) return "";
        // Verifica se a URL já começa com http ou https
        const isUrlCompleta = url.startsWith("http://") || url.startsWith("https://");
        
        return isUrlCompleta ? url : `${urlBancoDeDados}/${url}`;
      };

    const estadoFotoPerfilUser = ()=>{
        switch(estadoFotoPerfil){
            case "none":
                return (
                       <div className="ConteinerRightMenuTopBoxLeftCaxa2Icone IconePerfilPadraoMenuTop">
                            <img src={Perfil} alt="" />
                        </div>
                )
            break
            case "ativo":
                const URLIMAGE = `${getUrlVideo(ChatAtivo?.foto_amigo)}`
                if (URLIMAGE === `${urlBancoDeDados}`){
                    return (
                        <div className="ConteinerRightMenuTopBoxLeftCaxa2Icone IconePerfilPadraoMenuTop">
                            <img src={Perfil} alt="" />
                        </div>
                    )
                }
                return (
                    <div className="ConteinerRightMenuTopBoxLeftCaxa2Icone">
                        <img src={URLIMAGE} alt="" />
                    </div>
                )
            break
        }
    }
    

    // 3. Verificamos se este amigo específico está digitando para nós
    const estaDigitando = digitandoStatus[ChatAtivo?.id_amigo];

    // 4. Definimos o status de conexão.
    const statusAtual = amigoNoEstado?.status || "online";

    // Proteção caso o componente tente renderizar sem um chat selecionado
    if (!ChatAtivo) return null;

    
    return (
        <div className="ConteinerRightMenuTop">
            <div className="ConteinerRightMenuTopBoxLeft">
                <div 
                    className="ConteinerRightMenuTopBoxLeftCaxa1" 
                    onClick={() => Back_home(socket, ChatAtivo.nossa_sala, setMostrarChat , setIsMobile)}
                >
                    <SetaEsquerda ativarConteiner = {ativarConteiner} />
                </div>
                
                <div className="ConteinerRightMenuTopBoxLeftCaxa2">
                    {/* Exibe as iniciais do nome */}
                    {estadoFotoPerfilUser()}
                </div>
                
                <div className="ConteinerRightMenuTopBoxLeftCaxa3">
                    <b> {ChatAtivo.nome_amigo} </b>
                    
                    {/* LÓGICA DINÂMICA: Prioridade para 'Digitando', depois Status de conexão */}
                    {estaDigitando ? (
                        <li style={{ 
                            color: 'var(--chat-theme-online, var(--status-online))',
                            listStyle: 'none', 
                            fontSize: '12px', 
                            fontWeight: '600',
                            fontStyle: 'italic'
                        }}>
                            Digitando...
                        </li>
                    ) : (
                        <li style={{ 
                            color: statusAtual === 'online'
                                ? 'var(--chat-theme-online, var(--status-online))'
                                : 'var(--chat-theme-muted, var(--text-muted))',
                            listStyle: 'none',
                            fontSize: '13px',
                            fontWeight: '500'
                        }}>
                            {statusAtual === 'online' ? 'Online' : 'Offline'}
                        </li>
                    )}
                </div>
            </div>

            <div className="ConteinerRightMenuTopBoxRight">
                <div className="chat-theme-menu">
                    <button
                        type="button"
                        className="ConteinerRightMenuTopBoxRightCaxa chat-theme-toggle"
                        aria-label="Alterar fundo e cores da conversa"
                        aria-expanded={mostrarTemas}
                        aria-haspopup="dialog"
                        onClick={() => setMostrarTemas((visivel) => !visivel)}
                    >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <path d="M12 3a9 9 0 1 0 0 18h1.2a1.8 1.8 0 0 0 1.1-3.2 1.5 1.5 0 0 1 .9-2.7H17a4 4 0 0 0 4-4c0-4.5-4-8.1-9-8.1Z" />
                            <circle cx="7.5" cy="11" r="1" />
                            <circle cx="10" cy="7.5" r="1" />
                            <circle cx="15" cy="7.5" r="1" />
                        </svg>
                    </button>
                    {mostrarTemas && (
                        <div className="chat-theme-picker" role="dialog" aria-label="Fundos e cores do chat">
                            <div className="chat-theme-picker-header">
                                <strong>{chatThemeMode === "animated" ? "Cenas animadas" : "Temas do chat"}</strong>
                                <button
                                    type="button"
                                    aria-label="Fechar seletor de fundos"
                                    onClick={() => setMostrarTemas(false)}
                                >
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                                        <path d="m18 6-12 12M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                            <button
                                type="button"
                                className="chat-theme-mode-toggle"
                                aria-pressed={chatThemeMode === "animated"}
                                onClick={() => {
                                    if (chatThemeMode === "animated") {
                                        onSelectChatTheme(chatTheme)
                                    } else {
                                        onSelectAnimatedScene(animatedScene.id)
                                    }
                                }}
                            >
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                    <path d="M5 3v18l15-9z" />
                                </svg>
                                {chatThemeMode === "animated" ? "Voltar aos temas estáticos" : "Explorar temas animados"}
                            </button>
                            {chatThemeMode === "animated" && (
                                <div className="chat-theme-animation-controls">
                                    <span>Cena: {animatedScene.name}</span>
                                    <button type="button" onClick={onToggleAnimation}>
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                            {animationPaused
                                                ? <path d="m8 5 12 7-12 7z" />
                                                : <path d="M8 5v14M16 5v14" />}
                                        </svg>
                                        {animationPaused ? "Retomar animação" : "Pausar animação"}
                                    </button>
                                </div>
                            )}
                            <div className="chat-theme-options">
                                {(chatThemeMode === "animated"
                                    ? ANIMATED_CHAT_SCENES
                                    : [DEFAULT_CHAT_THEME, ...CHAT_THEMES]
                                ).map((theme) => (
                                    <button
                                        type="button"
                                        key={theme.id}
                                        className="chat-theme-option"
                                        aria-pressed={chatThemeMode === "animated"
                                            ? animatedScene.id === theme.id
                                            : chatTheme.id === theme.id}
                                        onClick={() => {
                                            if (chatThemeMode === "animated") {
                                                onSelectAnimatedScene(theme.id)
                                            } else {
                                                onSelectChatTheme(theme)
                                                setMostrarTemas(false)
                                            }
                                        }}
                                    >
                                        <span
                                            className="chat-theme-swatch"
                                            style={{ background: chatThemeMode === "animated" ? theme.swatch : theme.wallpaper }}
                                            aria-hidden="true"
                                        />
                                        <span>{theme.name}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
                <div className="ConteinerRightMenuTopBoxRightCaxa" onClick={ ()=> MenuMobileRight(setMostrarChat)}>
                    <Store />
                </div>
                <button
                    type="button"
                    className="ConteinerRightMenuTopBoxRightCaxa chat-call-button"
                    aria-label={`Ligar para ${ChatAtivo.nome_amigo}`}
                    title="Iniciar chamada de voz"
                    disabled={Boolean(chamadaVozAtiva)}
                    onClick={() => void iniciarChamadaVoz({
                        socket,
                        dadosUsuario,
                        destinatario: ChatAtivo,
                        tipo: "voice",
                    })}
                >
                    <Telefone />
                </button>
                <button
                    type="button"
                    className="ConteinerRightMenuTopBoxRightCaxa chat-call-button"
                    aria-label={`Iniciar vídeo chamada com ${ChatAtivo.nome_amigo}`}
                    title="Iniciar vídeo chamada"
                    disabled={Boolean(chamadaVozAtiva)}
                    onClick={() => void iniciarChamadaVoz({
                        socket,
                        dadosUsuario,
                        destinatario: ChatAtivo,
                        tipo: "video",
                    })}
                >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M3 7.5A2.5 2.5 0 0 1 5.5 5h8A2.5 2.5 0 0 1 16 7.5v9A2.5 2.5 0 0 1 13.5 19h-8A2.5 2.5 0 0 1 3 16.5z" />
                        <path d="m16 10 5-3v10l-5-3" />
                    </svg>
                </button>
            </div>
        </div>
    );
}