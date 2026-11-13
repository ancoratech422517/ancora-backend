import { lazy, Suspense, useState, useEffect, useLayoutEffect, useRef } from 'react'
import './App.css'
const Conteiner1 = lazy(() => import("./conteinerPrincipal/conteiner1/conteiner1"))
const Conteiner2 = lazy(() => import('./conteinerPrincipal/conteiner2/conteiner2'))
const Conteiner3 = lazy(() => import('./conteinerPrincipal/conteiner3/conteiner3'))
const Conteiner4 = lazy(() => import('./conteinerPrincipal/conteiner4/conteiner4'))
const Conteiner5 = lazy(() => import('./conteinerPrincipal/conteiner5/conteiner5'))
const Conteiner6 = lazy(() => import("./conteinerPrincipal/conteiner6/conteiner6"))
const Conteiner8 = lazy(() => import('./conteinerPrincipal/conteiner8/conteiner8'))
import MenuConteinerLeft from './conteinerPrincipal/conteiner1/conteinerLeft/menuConteinerLeft'
import Conteiner_Animacao_Chamada_Grupo from './conteinerPrincipal/conteiner-animacao/conteiner-animacao-chamada/conteiner-animacao-chamada.jsx'
import { useUserStore } from './useUseSotore'
import { fetchComAuth } from './utils/api'
const ConteinerRightLive = lazy(() => import('./conteinerPrincipal/conteiner1/conteinerRight/ConteinerRightLive.jsx'))
import { CHAT_THEMES, DEFAULT_CHAT_THEME } from './conteinerPrincipal/conteiner1/conteinerRight/chatThemes'
import VoiceCallOverlay from './conteinerPrincipal/conteiner1/conteinerRight/VoiceCallOverlay'
const PublicAdPage = lazy(() => import('./conteinerPrincipal/conteiner3/PublicAdPage'))
import { getInitialTheme } from './utils/theme'
import { preparePrivateMediaStorage } from './utils/privateMediaStorage'
import OfflineSyncIndicator from './components/OfflineSyncIndicator'


function App() {
  const publicAdId = new URLSearchParams(window.location.search).get("ad")
  useLayoutEffect(() => {
    document.documentElement.dataset.theme = getInitialTheme();
  }, []);
  const { 
    dadosUsuario, 
    conectarSocket, 
    autenticarSocket,
    socket, setDados, 
    setNotificacoes , 
    urlBancoDeDados , 
    ativar , 
    setAtivar,
    estado_conteiner_live,
    Dados_Live_Ancora , 
    EstadoConteinerVideoTurmaExibir,
    set_EstadoConteinerVideoTurmaExibir,
    set_Dados_Video_Atual_Click,
    Dados_Video_Atual_Click,
    Dados_Biblioteca_Video_Turma,
    EstadoChamadaGrupo,
    chatThemeId
  } = useUserStore()
  const [carregandoSessao, setCarregandoSessao] = useState(false)
  const [sessaoInicializada, setSessaoInicializada] = useState(false)
  const buscouNotificacoes = useRef(false)
  const jaChegouSessao = useRef(false)
  const chatThemePalette = CHAT_THEMES.find((theme) => theme.id === chatThemeId)
  const condicaoEstadoChamadaGrupo = ()=>{
    switch(EstadoChamadaGrupo){
      case true:
        return(
          <Conteiner_Animacao_Chamada_Grupo />
        )
    }

  }
  
  const getUrlVideo = (url) => {
  if (!url) return "";
    // Verifica se a URL já começa com http ou https
    const isUrlCompleta = url.startsWith("http://") || url.startsWith("https://");
    
    return isUrlCompleta ? url : `${urlBancoDeDados}/${url}`;
  };

  const condicaoEstadoConteinerTurmaVideoExibir = ()=>{
    switch(EstadoConteinerVideoTurmaExibir){
      case true:
        return(
            <div className="ConteinerViseualizacaoVideoTurma">

              <div className="ConteinerViseualizacaoVideoTurmaConteiner">
                  <div className="ConteinerViseualizacaoVideoTurmaConteinerListaVideo">
                    <div className="ConteinerViseualizacaoVideoTurmaConteinerListaVideoMenuTop">
                      <b>Ancora Ecommerce</b>
                      <li> Aproveite o seu Curso de Javascript</li>
                    </div>

                    <div className="ConteinerViseualizacaoVideoTurmaConteinerListaVideoScroll">
                      {Array.isArray(Dados_Biblioteca_Video_Turma) && Dados_Biblioteca_Video_Turma.map((dados, index)=>{
                        return(
                            <div key={`${dados.url_video || "aula"}-${index}`} onClick={()=>{set_Dados_Video_Atual_Click(getUrlVideo(dados.url_video))}} className="ConteinerViseualizacaoVideoTurmaConteinerListaVideoScrollDados">

                              <div className="ConteinerViseualizacaoVideoTurmaConteinerListaVideoScrollDadosVideo">
                                <video src={getUrlVideo(dados.url_video)} ></video>
                              </div>
                              
                              <div className="ConteinerViseualizacaoVideoTurmaConteinerListaVideoScrollDadosCont">
                                  <b>{dados.tema_video}</b>
                                  <li>Mete sempre em pratica o que aprendes</li>
                              </div>
                            </div>

                        )
                      })}
                      
                    </div>

                  </div>
                  <div className="ConteinerViseualizacaoVideoTurmaConteinerVideo">
                    <video src={getUrlVideo(Dados_Video_Atual_Click)} controls autoCapitalize=''></video>
                  </div>
                  <div onClick={()=>{set_EstadoConteinerVideoTurmaExibir(false)}} className="ConteinerViseualizacaoVideoTurmaConteinerClose">x</div>
              </div>
            </div>

        )
    }
  }

  const condicaoEstadoMenuLiveAncora = ()=>{
    switch(estado_conteiner_live){
      case true:
        return(
          <ConteinerRightLive roomName={Dados_Live_Ancora.sala_Turma} nome_Turma={Dados_Live_Ancora.nome_Turma} />
        )
    }
  }
  
  const containerAtual = sessaoInicializada
    ? ativar
    : dadosUsuario?.id ? "conteiner1" : "conteiner6"

  useEffect(() => {
    preparePrivateMediaStorage().catch((error) => {
      console.error("Não foi possível preparar o armazenamento privado da Âncora:", error)
    })
  }, [])

  useEffect(() => {
    if (!socket) return

    const handleNovoEstadoAmigo = (novoEstado) => {
      if (!novoEstado?.id || !novoEstado?.id_usuario) {
        console.error("Estado recebido via socket inválido:", novoEstado)
        return
      }

      useUserStore.setState((state) => {
        const estados = Array.isArray(state.DADOSESTADOAMIGO)
          ? state.DADOSESTADOAMIGO
          : []
        if (estados.some((estado) => String(estado?.id) === String(novoEstado.id))) {
          return state
        }
        return { DADOSESTADOAMIGO: [...estados, novoEstado] }
      })
    }

    socket.on("novo_estado_amigo", handleNovoEstadoAmigo)
    return () => socket.off("novo_estado_amigo", handleNovoEstadoAmigo)
  }, [socket])

  // --- BUSCA INICIAL DE NOTIFICAÇÕES ---
  useEffect(() => {
    if (dadosUsuario?.id && !buscouNotificacoes.current) {
      buscouNotificacoes.current = true
      console.log("Engenharia: Executando busca única de notificações...")

      fetchComAuth(`${urlBancoDeDados}/notificacoes/${dadosUsuario.id}`)
       .then(res => res.json())
       .then(dados => {
          if (Array.isArray(dados)) {
            setNotificacoes(dados)
          }
        })
       .catch(err => {
          console.error("Erro na busca inicial:", err)
        })
    }
  }, [dadosUsuario?.id, setNotificacoes, urlBancoDeDados])

  // --- LÓGICA DO WEBSOCKET ---
  useEffect(() => {
    if (!dadosUsuario?.id) return

    if (!socket?.connected) {
      console.log("Conectando WebSocket para o ID:", dadosUsuario.id)
      conectarSocket()
      return
    }

    autenticarSocket()
  }, [dadosUsuario?.id, socket, conectarSocket, autenticarSocket])

  // --- CHECAGEM DE SESSÃO COM REFRESH TOKEN ---
  useEffect(() => {
    if (jaChegouSessao.current) return // SÓ RODA 1 VEZ
    jaChegouSessao.current = true

    async function checarSessao() {
      if (publicAdId) {
        return
      }
      const cachedUser = useUserStore.getState().dadosUsuario
      setAtivar(cachedUser?.id ? "conteiner1" : "conteiner6")

      try {
        console.log("🔍 Verificando sessão...")
        const res = await fetchComAuth(`${urlBancoDeDados}/api/me`)

        if (res.ok) {
          const dados = await res.json()
          setDados(dados)
          setAtivar("conteiner1")
          console.log("✅ Sessão restaurada:", dados.nome)
        } else if (res.status === 401) {
          setAtivar("conteiner6")
          console.log("❌ Sem sessão ativa")
        } else if (!cachedUser?.id) {
          setAtivar("conteiner6")
        }
      } catch (err) {
        console.warn("Não foi possível validar a sessão com o servidor:", err)
        if (cachedUser?.id && err?.message !== "Sessão expirada") {
          setAtivar("conteiner1")
        } else {
          setAtivar("conteiner6")
        }
      } finally {
        setCarregandoSessao(false)
        setSessaoInicializada(true)
      }
    }
    checarSessao()
  }, [publicAdId, setAtivar, setDados, urlBancoDeDados])

  const renderizar_conteiner = () => {
    if (carregandoSessao) return <div className='loading-page'>
      
      <div class="pyramid-loader">
          <div class="wrapper">
            <span class="side side1"></span>
            <span class="side side2"></span>
            <span class="side side3"></span>
            <span class="side side4"></span>
            <span class="shadow"></span>
          </div>  
          <h2 className='title-welcom'>Ancora E-commerce</h2>
      </div>

    </div>

    switch(containerAtual) {
      case "conteiner1": return <Conteiner1 ativarConteiner={setAtivar} />
      case "conteiner2": return <Conteiner2 />
      case "conteiner3": return <Conteiner3 />
      case "conteiner4": return <Conteiner4 />
      case "conteiner8": return <Conteiner8 />
      case "conteiner5": return <Conteiner5 dadosUsuario={dadosUsuario} />
      case "conteiner6": return <Conteiner6 ativarConteiner={setAtivar} setConta={setAtivar} />
      default:
        return <Conteiner2 ativarConteiner={setAtivar} setConta={setAtivar} />
    }
  }

  if (publicAdId) {
    return (
      <Suspense fallback={<div className="loading-page">A carregar anúncio...</div>}>
        <PublicAdPage adId={publicAdId} />
      </Suspense>
    )
  }

  return (
    <section
      className='conteinerPrincipal'
      data-chat-theme-palette={chatThemeId !== DEFAULT_CHAT_THEME.id ? chatThemeId : undefined}
      style={chatThemePalette?.style}
    >
      {!carregandoSessao && containerAtual !== "conteiner6" && (
        <MenuConteinerLeft ativarConteiner={setAtivar} setDadosUsuario={setDados} />
      )}
      <Suspense fallback={<div className="loading-page">A carregar Âncora...</div>}>
        {renderizar_conteiner()}
        {condicaoEstadoMenuLiveAncora()}
        {condicaoEstadoConteinerTurmaVideoExibir()}
        {condicaoEstadoChamadaGrupo()}
      </Suspense>
      <VoiceCallOverlay />
      <OfflineSyncIndicator />

    </section>
  )
}

export default App
