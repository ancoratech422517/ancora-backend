import { useState, useEffect, useRef } from 'react'
import './App.css'
import Conteiner1 from "./conteinerPrincipal/conteiner1/conteiner1"
import Conteiner2 from './conteinerPrincipal/conteiner2/conteiner2'
import Conteiner3 from './conteinerPrincipal/conteiner3/conteiner3'
import Conteiner4 from './conteinerPrincipal/conteiner4/conteiner4'
import Conteiner5 from './conteinerPrincipal/conteiner5/conteiner5'
import Conteiner6 from "./conteinerPrincipal/conteiner6/conteiner6"
import Conteiner8 from './conteinerPrincipal/conteiner8/conteiner8'
import MenuConteinerLeft from './conteinerPrincipal/conteiner1/conteinerLeft/menuConteinerLeft'
import { useUserStore } from './useUseSotore'
import { fetchComAuth } from './utils/api'



function App() {
  const { dadosUsuario, conectarSocket, socket, setDados, setNotificacoes , urlBancoDeDados , ativar , setAtivar } = useUserStore()

  
  const [carregandoSessao, setCarregandoSessao] = useState(true)
  const buscouNotificacoes = useRef(false)
  const jaChegouSessao = useRef(false) // TRAVA NOVA

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
  }, [dadosUsuario?.id, setNotificacoes])

  // --- LÓGICA DO WEBSOCKET ---
  useEffect(() => {
    if (dadosUsuario?.id && !socket) {
      console.log("Conectando WebSocket para o ID:", dadosUsuario.id)
      conectarSocket()
    }
  }, [dadosUsuario?.id, socket, conectarSocket])

  // --- CHECAGEM DE SESSÃO COM REFRESH TOKEN ---
  useEffect(() => {
    if (jaChegouSessao.current) return // SÓ RODA 1 VEZ
    jaChegouSessao.current = true

    async function checarSessao() {
      const inicio = Date.now() // ⬅️ marca início

      try {
        console.log("🔍 Verificando sessão...")
        const res = await fetchComAuth(`${urlBancoDeDados}/api/me`)

        if (res.ok) {
          const dados = await res.json()
          setDados(dados)
          setAtivar("conteiner1")
          console.log("✅ Sessão restaurada:", dados.nome)
        } else {
          setAtivar("conteiner6")
          console.log("❌ Sem sessão ativa")
        }
      } catch (err) {
        console.log("❌ Erro ao checar sessão:", err)
        setAtivar("conteiner6")
      } finally {
        const tempoDecorrido = Date.now() - inicio
        const tempoMinimo = 2000 // ⬅️ 5 segundos

        const tempoRestante = tempoMinimo - tempoDecorrido

        if (tempoRestante > 0) {
          setTimeout(() => {
            setCarregandoSessao(false)
          }, tempoRestante)
        } else {
          setCarregandoSessao(false)
        }
      }
    }
    checarSessao()
  }, []) // DEPENDÊNCIA VAZIA AGORA

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

    switch(ativar) {
      case "conteiner1": return <Conteiner1 ativarConteiner={setAtivar} />
      case "conteiner2": return <Conteiner2 />
      case "conteiner3": return <Conteiner3 />
      case "conteiner4": return <Conteiner4 />
      case "conteiner8": return <Conteiner8 />
      case "conteiner5": return <Conteiner5 dadosUsuario={dadosUsuario} />
      case "conteiner6": return <Conteiner6 ativarConteiner={setAtivar} setConta={setAtivar} />
      default:
        return <Conteiner6 ativarConteiner={setAtivar} setConta={setAtivar} />
    }
  }

  return (
    <section className='conteinerPrincipal' >
      {!carregandoSessao && ativar !== "conteiner6" && (
        <MenuConteinerLeft ativarConteiner={setAtivar} setDadosUsuario={setDados} />
      )}
      {renderizar_conteiner()}
    </section>
  )
}

export default App
