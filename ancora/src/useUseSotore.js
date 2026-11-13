import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { io } from 'socket.io-client'
import { fetchComAuth } from './utils/api'
import { saveChatHistory, saveChatMessage } from './utils/offlineStorage'

const CHAT_THEME_STORAGE_KEY = "ancora-chat-theme"
const url = (
  "https://ancora-backend-09zc.onrender.com" || "https://ancora-backend-09zc.onrender.com"
).replace(/\/+$/, "")
function messageKey(message) {
  if (message.client_message_id) return `client:${message.client_message_id}`
  if (message.id != null) return `id:${message.id}`
  return null
}

function mergeMessages(messages = []) {
  const merged = new Map()
  messages.forEach((message) => {
    const key = messageKey(message)
    if (!key) {
      merged.set(`anonymous:${merged.size}`, message)
      return
    }
    const previous = merged.get(key)
    const mergedMessage = { ...previous, ...message }
    if (previous?.blobUrl && message.id != null && !String(message.id).startsWith("pending:")) {
      URL.revokeObjectURL(previous.blobUrl)
      delete mergedMessage.blobUrl
    }
    if (message.id != null && !String(message.id).startsWith("pending:")) {
      mergedMessage.pending = false
      mergedMessage.deliveryState = "sent"
    }
    merged.set(key, mergedMessage)
  })
  return Array.from(merged.values())
}

function cacheCurrentChat(state, messages, updatedMessage = null) {
  if (!state.dadosUsuario?.id || !state.ChatAtivo?.nossa_sala) return
  const roomId = state.ChatAtivo.nossa_sala
  const save = updatedMessage
    ? saveChatMessage(state.dadosUsuario.id, roomId, updatedMessage, messages.length - 1)
    : saveChatHistory(state.dadosUsuario.id, roomId, messages)
  void save.catch((error) => {
    console.error("Não foi possível guardar o histórico local da conversa:", error)
  })
}

function getInitialChatThemeId() {
  try {
    return localStorage.getItem(CHAT_THEME_STORAGE_KEY) || "original"
  } catch (error) {
    console.error("Não foi possível carregar o tema do chat:", error)
    return "original"
  }
}

// teste
export const useUserStore = create(
  
  
  persist( 
    (set, get) => ({
      urlBancoDeDados: url,
      chatThemeId: getInitialChatThemeId(),
      chatThemeMode: "static",
      chatAnimatedSceneId: "warp",
      dadosUsuario: null,
      socket: null,
      socketConnecting: false,
      socketConnectionPromise: null,
      socketAuthenticatedUserId: null,
      socketAuthPendingUserId: null,
      notificacoes: [],
      amigos: [],
      chats: [],
      texto: [],
      menssagens: [],
      MenssagemLida: [],
      IdMenssagem: [],
      ProdutoUsuario: [],
      TodosProdutos: [],
      DadosSombra: [],
      ProdutoUsuarioChat: [],
      MostrarChat: false,
      digitandoStatus: {},
      ChatAtivo: null,
      ativarGrupo: false,
      pingIntervalId: null,
      AtivarCont: "geral",
      MostrarContRightWindow5: false,
      EstadoCompra: "produto",
      DadosCompraVendedor: [],
      PedidosProdutos: [],
      DetalhesProduto: [],
      AtivarDetalhes: "false",
      EstadoNotificacao: "False",
      estadoMenu: "none",
      ativar: "conteiner8",
      MostrarProdutoTrafego: "false",
      dadosTrafego: [],
      trafegoEscolhido: [],
      estadoConteinerDeposito: "False",
      TextoAmigo:"Adicionar",
      ClienteVendedor:[],
      TurmaUsuario: [],
      EstadoMenuMobila: "normal",
      DadosTurma:null,
      AlunTurma: [],
      UsuarioAncora: [],
      DadosTurmaAtual: [],
      estado_conteiner_live: false,
      Dados_Live_Ancora:"",
      Dados_Agenda_Turma:[],
      Dados_Biblioteca_Video_Turma:[],
      EstadoConteinerVideoTurmaExibir: false,
      Dados_Video_Atual_Click: "",
      IsMobile: false,
      FalseTurma:false,
      mostrarConteinerAgenda:false,
      mostrarConteinerUsuarioConvite:false,
      estadoConteinerAdicionarVideo:false,
      EstadoChamadaGrupo:false,
      DadosChamadaGrupo:null,
      chamadaVozAtiva: null,
      Negritar:false,
      FotoPerfilUsuario:false,
      DadosPerfilUsuario:[],
      EstadoResposta:false,
      MostrarLoadingAdicionarEstado:false,
      ConteinerDadosEstdo:[],
      MostrarConteinerEstadoUserViews: false,
      DadosEstadoElementoClicado:{},
      DadosGeralEstadoUser:[],
      TipoConteudoViewEstado:"",
      DADOSUSUARIO:[],
      DADOSPRODUTO:[],
      DADOSTURMA:[],
      DADOSTOTALAMIGO:[],
      DADOSTOTALPRODUTO:[],
      DADOSTOTALTURMAUSUARIO:[],
      DADOSESTADOAMIGO:[],
      DADOSTIPOVIEWSLAYUTELEFT:false,
      CONFIRMARSAIDA: false,
      CONDICACAOMOSTRARESTADOETRURMAVIEWS : false,
      DADOSTIPOCHAT:"normal",
      FUNDOVAZIOCHAT:"",
      CONDICAOMOSTRARMENUMOBILEESTADOUSER: false,
      Tipo_Chat_Turma : false , 
      // --- SOM ---
      tocarSomEnvio: () => {
        const audio = new Audio('/sounds/envio.mp3')
        audio.volume = 0.2
      
        audio.play().catch(err => console.log("Erro som envio:", err))
      },


      tocarSomRecebido: () => {
        const audio = new Audio('/sounds/notificacao3.mp3')
        audio.volume = 0.6
        audio.play().catch(err => console.log("Erro som recebido:", err))
      },

      tocarSomChamada: () => {
        const audioAnterior = get().audioChamada
        if (audioAnterior) {
          audioAnterior.pause()
          audioAnterior.currentTime = 0
        }

        const audio = new Audio('/sounds/chamada.mp3')
        audio.volume = 0.6
        audio.loop = true
        set({audioChamada:audio})
        audio.play().catch(err => {
          console.log("Erro som chamada:", err)
          if (get().audioChamada === audio) set({audioChamada:null})
        })
      },

      pararSomChamada: () =>{
        const {audioChamada} = get()
        set({audioChamada:null})
        if (audioChamada){
          audioChamada.pause()
          audioChamada.currentTime = 0
        }

      },

      // --- SETTERS ---
      setDados: (dados) => set((state) => ({
        dadosUsuario: dados,
        socketAuthenticatedUserId: String(state.dadosUsuario?.id ?? "") === String(dados?.id ?? "")
          ? state.socketAuthenticatedUserId
          : null,
        socketAuthPendingUserId: null,
      })),
      setSocket: (socket) => set({ socket }),
      autenticarSocket: () => {
        const { socket, dadosUsuario, socketAuthenticatedUserId, socketAuthPendingUserId } = get()
        const userId = dadosUsuario?.id
        if (!socket?.connected || !userId) return

        const userIdKey = String(userId)
        if (socketAuthenticatedUserId === userIdKey || socketAuthPendingUserId === userIdKey) return

        set({ socketAuthPendingUserId: userIdKey })
        const timeoutId = setTimeout(() => {
          if (get().socketAuthPendingUserId === userIdKey) {
            set({ socketAuthPendingUserId: null })
            console.error("Tempo esgotado ao autenticar o socket do usuário.")
          }
        }, 8000)

        socket.emit("autenticar", (resultado) => {
          clearTimeout(timeoutId)
          if (get().socket !== socket || get().socketAuthPendingUserId !== userIdKey) return

          if (!resultado?.ok) {
            set({ socketAuthPendingUserId: null })
            console.error("Falha na autenticação do socket:", resultado?.erro)
            return
          }

          set({
            socketAuthenticatedUserId: userIdKey,
            socketAuthPendingUserId: null,
          })
        })
      },
      setNotificacoes: (lista) => set({ notificacoes: lista }),
      setChatThemeId: (chatThemeId) => {
        set({ chatThemeId, chatThemeMode: "static" })
        try {
          localStorage.setItem(CHAT_THEME_STORAGE_KEY, chatThemeId)
        } catch (error) {
          console.error("Não foi possível guardar o tema do chat:", error)
        }
      },
      setChatAnimatedSceneId: (chatAnimatedSceneId) => set({
        chatAnimatedSceneId,
        chatThemeMode: "animated",
      }),
      setAmigos: (amigo) => set({ amigos: amigo }),
      atualizarUltimaMensagemChat: (nossaSala, mensagem, horario, remetenteId, lida = false) => set((state) => {
        const amigosAtualizados = state.amigos.map((amigo) =>
          String(amigo.nossa_sala) === String(nossaSala)
            ? {
                ...amigo,
                ultima_menssagem: mensagem,
                HoraMenssagem: horario,
                ultima_menssagem_remitente_id: remetenteId ?? amigo.ultima_menssagem_remitente_id,
                ultima_menssagem_lida: remetenteId == null ? amigo.ultima_menssagem_lida : lida
              }
            : amigo
        )
        const indiceAmigo = amigosAtualizados.findIndex(
          (amigo) => String(amigo.nossa_sala) === String(nossaSala)
        )
        return {
          amigos: indiceAmigo > 0
            ? [amigosAtualizados[indiceAmigo], ...amigosAtualizados.slice(0, indiceAmigo), ...amigosAtualizados.slice(indiceAmigo + 1)]
            : amigosAtualizados
        }
      }),
      setChat: (chat) => set({ chats: chat }),
      setTexto: (text) => set({ texto: text }),
      setMenssagemLida: (lida) => set({ MenssagemLida: lida }),
      setIdMenssagem: (id) => set({ IdMenssagem: id }),
      setMostrar: (mostra) => set({ Mostrar: mostra }),
      setProdutoUsuarioChat: (lista) => set({ ProdutoUsuarioChat: lista }),
      setMostrarChat: (valor) => set({ MostrarChat: valor }),
      setProdutoUsuario: (produto) => set({ ProdutoUsuario: Array.isArray(produto) ? produto : [] }),
      setTodosProdutos: (todos) => set({ TodosProdutos: todos }),
      setDadosSombra: (sombra) => set({ DadosSombra: sombra }),
      setMenssagem: (msg) => set((state) => {
        if (
          state.ChatAtivo?.nossa_sala
          && String(msg?.nossa_sala) !== String(state.ChatAtivo.nossa_sala)
        ) return state
        const menssagens = mergeMessages([...state.menssagens, msg])
        cacheCurrentChat(state, menssagens, msg)
        return { menssagens }
      }),
      limparMensagens: () => set({ menssagens: [] }),
      setMenssagensAntigas: (novasMenssagens) => set((state) => {
        if (!Array.isArray(novasMenssagens) || !state.ChatAtivo?.nossa_sala) return state
        const roomMessages = novasMenssagens.filter(
          (message) => String(message.nossa_sala) === String(state.ChatAtivo.nossa_sala)
        )
        const menssagens = mergeMessages([...roomMessages, ...state.menssagens])
        cacheCurrentChat(state, menssagens)
        return { menssagens }
      }),
      setChatAtivo: (dadosChatAtivo) => set({ ChatAtivo: dadosChatAtivo, menssagens: [] }),
      confirmarMenssagemPendente: (clientMessageId, mensagemId, mensagemAtualizada = {}) => set((state) => {
        const menssagens = state.menssagens.map((menssagem) =>
          String(menssagem.client_message_id) === String(clientMessageId)
            ? (() => {
              const falhou = mensagemAtualizada.deliveryState === "failed"
              if (menssagem.blobUrl && !falhou) URL.revokeObjectURL(menssagem.blobUrl)
                return {
                  ...menssagem,
                  ...mensagemAtualizada,
                  id: mensagemId,
                blobUrl: falhou ? menssagem.blobUrl : undefined,
                pending: !falhou,
                deliveryState: mensagemAtualizada.deliveryState || "sent",
                }
              })()
            : menssagem
        )
        cacheCurrentChat(
          state,
          menssagens,
          menssagens.find((message) => String(message.client_message_id) === String(clientMessageId))
        )
        return { menssagens }
      }),
      limparChat: () => set({ ChatAtivo: null, menssagens: [] }),
      setativarGrupo: (ativaGrupo) => set({ ativarGrupo: ativaGrupo }),
      setAtivarCont: (Ativar) => set({ AtivarCont: Ativar }),
      setMostrarContRightWindow5: (mostrarCont) => set({ MostrarContRightWindow5: mostrarCont }),
      setEstadoCompra: (compra) => set({ EstadoCompra: compra }), // CORRIGIDO: faltava set()
      setDadosCompraVendedor: (DadosCompra) => set({ DadosCompraVendedor: DadosCompra }),
      setPedidosProdutos: (pedidos) => set({ PedidosProdutos: pedidos }),
      setDetalhesProduto: (detalhes) => set({ DetalhesProduto: detalhes }),
      setAtivarDetalhes: (ativarDetalhes) => set({ AtivarDetalhes: ativarDetalhes }),
      setEstadoNotificacao: (estadoQuantidadeNotificacao) => set({ EstadoNotificacao: estadoQuantidadeNotificacao }),
      seturlBancoDeDados: (url) => set({ urlBancoDeDados: url }),
      setEstadoMenu: (menu) => set({ estadoMenu: menu }),
      setAtivar: (ativa) => set({ ativar: ativa }),
      setMostrarProdutoTrafego: (mudar_estado) => set({ MostrarProdutoTrafego: mudar_estado }),
      setDadosTrafego: (trafego) => set({ dadosTrafego: trafego }),
      setTrafegoEscolhido: (escolhido) => set({ trafegoEscolhido: escolhido }),
      setEstadoConteinerDeposito: (cont) => set({ estadoConteinerDeposito: cont }),
      setTextoAmigo:(testeAmigo) => set({TextoAmigo:testeAmigo}),
      setClienteVendedor: (cliente_vendedor) => set({ClienteVendedor:cliente_vendedor}),
      setTurmaUsuario: (turma_usuario) => set({TurmaUsuario: turma_usuario}),
      setEstadoMenuMobila:(estado_menu_mobile) => set({EstadoMenuMobila: estado_menu_mobile}),
      setDadosTurma: (dados_turma) => set({DadosTurma: dados_turma}),
      setAlunTurma: (aluno_turma) => set({AlunTurma:aluno_turma}),
      setUsuarioAncora: (usuario_ancora) => set({UsuarioAncora:usuario_ancora}),
      setDadosTurmaAtual: (dados_turma_atual) => set({DadosTurmaAtual:dados_turma_atual}),
      set_estado_conteiner_live: (estado_conteiner_live_ancora) => set({estado_conteiner_live:estado_conteiner_live_ancora}),
      set_Dados_Live_Ancora: (dadosLiveAncora) => set({Dados_Live_Ancora:dadosLiveAncora}),
      set_Dados_Agenda_Turma: (dados_agenda_turma) => set({Dados_Agenda_Turma:dados_agenda_turma}),
      set_Dados_Biblioteca_Video_Turma: (dados_biblioteca_video_turma) => set({Dados_Biblioteca_Video_Turma:dados_biblioteca_video_turma}),
      set_EstadoConteinerVideoTurmaExibir:(estado_conteiner_video_turma_exibir) => set({EstadoConteinerVideoTurmaExibir:estado_conteiner_video_turma_exibir}),
      set_Dados_Video_Atual_Click:(dodos_video_actual_click)=> set({Dados_Video_Atual_Click:dodos_video_actual_click}),
      setIsMobile:(is_mobile) => set({IsMobile:is_mobile}),
      set_FalseTurma:(false_turma) => set({FalseTurma:false_turma}),
      setMostrarConteinerAgenda:(mostrar_conteiner_agenda)=>set({mostrarConteinerAgenda:mostrar_conteiner_agenda}),
      setMostrarConteinerUsuarioConvite:(mostrar_conteiner_usuario_convite) => set({mostrarConteinerUsuarioConvite:mostrar_conteiner_usuario_convite}),
      setEstadoConteinerAdicionarVideo:(estado_conteiner_adicionar_video) => set({estadoConteinerAdicionarVideo:estado_conteiner_adicionar_video}),
      setEstadoChamadaGrupo:(estado_chamada_grupo) => set({EstadoChamadaGrupo:estado_chamada_grupo}),
      setDadosChamadaGrupo:(dados) => set({DadosChamadaGrupo:dados}),
      setChamadaVozAtiva:(chamadaVozAtiva) => set({chamadaVozAtiva}),
      setNegritar: (estado_negritar) => set({Negritar:estado_negritar}),
      setFotoPerfilUsuario: (estado_foto_perfil_usuario) => set({FotoPerfilUsuario:estado_foto_perfil_usuario}),
      setDadosPerfilUsuario: (estado_dados_perfil_usuario) => set({setDadosPerfilUsuario:estado_dados_perfil_usuario}),
      setEstadoResposta: (estado_resposta) => set({EstadoResposta:estado_resposta}),
      setMostrarLoadingAdicionarEstado: (mostrar_estado_loading) =>set({MostrarLoadingAdicionarEstado:mostrar_estado_loading}),
      setConteinerDadosEstdo:(conteiner_dados_estado) => set({ConteinerDadosEstdo:conteiner_dados_estado}),
      setMostrarConteinerEstadoUserViews:(mostrar_conteiner_estado_user_views) => set({MostrarConteinerEstadoUserViews:mostrar_conteiner_estado_user_views}),
      setDadosEstadoElementoClicado:(dados_estado_elemento_clicado) => set({DadosEstadoElementoClicado:dados_estado_elemento_clicado}),
      setDadosGeralEstadoUser:(dados_geral_estado) => set({DadosGeralEstadoUser:dados_geral_estado}),
      setTipoConteudoViewEstado: (tipo_conteudo_view_estado) => set({TipoConteudoViewEstado:tipo_conteudo_view_estado}),
      setDADOSUSUARIO: (set_dados_usuario) => set({DADOSUSUARIO:set_dados_usuario}),
      setDADOSPRODUTO: (set_dados_produto) => set({DADOSPRODUTO:set_dados_produto}),
      setDADOSTURMA: (set_dados_turma) => set({DADOSTURMA:set_dados_turma}),
      setDADOSTOTALAMIGO: (set_dados_turma_total_amigo) => set({DADOSTOTALAMIGO:set_dados_turma_total_amigo}),
      setDADOSTOTALPRODUTO: (set_dados_total_produto) => set({DADOSTOTALPRODUTO:set_dados_total_produto}),
      setDADOSTOTALTURMAUSUARIO: (set_dados_total_turma_usuario) => set({DADOSTOTALTURMAUSUARIO:set_dados_total_turma_usuario}),
      set_DADOSESTADOAMIGO: (set_dados_estado_amigo) => set({DADOSESTADOAMIGO: set_dados_estado_amigo}),
      set_DADOSTIPOVIEWSLAYUTELEFT: (set_dados_tipo_views_layout_left) => set({DADOSTIPOVIEWSLAYUTELEFT:set_dados_tipo_views_layout_left}),
      set_CONFIRMARSAIDA: (set_confirmar_saida) => set({CONFIRMARSAIDA:set_confirmar_saida}),
      set_CONDICACAOMOSTRARESTADOETRURMAVIEWS: (set_condicacaomostrarestadoetrurmaviews) => set({CONDICACAOMOSTRARESTADOETRURMAVIEWS:set_condicacaomostrarestadoetrurmaviews}),
      setDADOSTIPOCHAT: (set_dados_tipo_chat) => set({DADOSTIPOCHAT:set_dados_tipo_chat}),
      setFUNDOVAZIOCHAT: (set_fundo_vazio_chat) => set({FUNDOVAZIOCHAT:set_fundo_vazio_chat}),
      setCONDICAOMOSTRARMENUMOBILEESTADOUSER: (set_CONDICAOMOSTRARMENUMOBILEESTADOUSER) => set({CONDICAOMOSTRARMENUMOBILEESTADOUSER:set_CONDICAOMOSTRARMENUMOBILEESTADOUSER}),
      set_Tipo_Chat_Turma: (set_tipo_chat_turma) => set({Tipo_Chat_Turma:set_tipo_chat_turma}),
      // --- OUTRAS AÇÕES ---
      limparDados: () => set({
        dadosUsuario: null,
        socket: null,
        notificacoes: [],
        amigos: [],
        menssagens: [],
        digitandoStatus: {},
        ChatAtivo: null,
        ProdutoUsuario: [],
        TodosProdutos: [],
        DadosSombra: [],
        ProdutoUsuarioChat: []
      }),

      elimiar_menssagem_array: (idMenssagem, sala_menssagem) => set((state) => {
        if (state.menssagens.length === 0) return state
        const novasMensagens = state.menssagens.filter((msg) => {
          const ehMensagemAlvo = String(msg.id) === String(idMenssagem) &&
            String(msg.nossa_sala) === String(sala_menssagem)
          return !ehMensagemAlvo
        })
        cacheCurrentChat(state, novasMensagens)
        return { menssagens: novasMensagens }
      }),
      // AQUI ESTAS A ACTUALIZAR A MENSSAGEM DO CHAT DE CONVERSA FOCA-TE NO PONTO CRUCIAL , PORUQE ESTOU A USAR MAPAEAMENTO 
      editar_menssagem_no_array: (id, novoConteudo, sala_menssagem) => set((state) => {
        const menssagens = state.menssagens.map((msg) => {
          if (
            String(msg.id) === String(id) &&
            (!sala_menssagem || String(msg.nossa_sala) === String(sala_menssagem))
          ) {
            return { ...msg, menssagem: novoConteudo }
          }
          return msg
        })
        cacheCurrentChat(state, menssagens)
        return { menssagens }
      }),

      buscarAmigosNoBanco: async (userId) => {
        if (!userId) return
        try {
          const res = await fetch(`${url}/api/get/meus_amigos/${userId}`, {
            credentials: "include"
          })
          if (!res.ok) throw new Error(`Erro HTTP: ${res.status}`)
          const dados = await res.json()
          if (Array.isArray(dados)) set({ amigos: dados })
        } catch (err) {
          console.error("Erro ao buscar amigos:", err)
        }
      },

      buscar_notificacao: async (userId) => {
        if (!userId) return
        try {
          const res = await fetch(`${url}/notificacoes/${userId}`, {
            credentials: "include"
          })
          const dados = await res.json()
          if (Array.isArray(dados)) set({ notificacoes: dados })
        } catch (err) {
          console.error("Erro notificações:", err)
        }
      },

      setQuantidadeMensagemNaoLida: (id_amigo, novaQuantidade) => {
        set((state) => ({
          amigos: state.amigos.map((amigo) => {
            if (String(amigo.id_amigo) === String(id_amigo)) {
              const valorFinal = Number(novaQuantidade)
              return { ...amigo, quantidade_menssagem_nao_lida: isNaN(valorFinal) ? 0 : valorFinal }
            }
            return amigo
          }),
        }))
      },

      setActualizarEstadoPrivado:(id_amigo , novo_status) =>
        set((state)=>({
          amigos: state.amigos.map((item)=>
              item.id_amigo === id_amigo ? { ...item , estado_privado_usuario:novo_status}:item
          )
        }))
      ,

      setActualizarUsuarioBloqueado:(id_amigo , novo_status) =>
        set((state) =>({
          amigos: state.amigos.map((item)=>
            item.id_amigo === id_amigo ? {...item , estado_bloqueado_usuario:novo_status}:item
          )
        })),

      setActualizarUsuarioExluido:(id_amigo , novo_status) =>
        set((state) =>({
          amigos: state.amigos.map((item)=>
            item.id_amigo === id_amigo ? {...item , estado_excluido_usuario: novo_status }:item
          )
        })),

      setUpdateProdutoAdoro: (id_produto, novoEstado) => {
        set((state) => ({
          TodosProdutos: state.TodosProdutos.map((p) =>
            p.id === id_produto
              ? {
                ...p,
                estado_adoro: novoEstado,
                quantidade_adoro_produto: novoEstado === "True"
                  ? Number(p.quantidade_adoro_produto) + 1
                  : Number(p.quantidade_adoro_produto) - 1
              }
              : p
          )
        }))
      },

      marcarComoLidaSeAberto: (data) => {
        const chatAtivo = get().ChatAtivo
        
        const s = get().socket
        if (chatAtivo && String(chatAtivo.nossa_sala) === String(data.nossa_sala)) {
          if (s?.connected) {
            s.emit("menssagem_visualizada", {
              nossa_sala: data.nossa_sala,
              id_amigo: data.id_remitente,
              id_remitente: get().dadosUsuario?.id
            })
          }
        }
      },

      conectarSocket: async () => {
        const currentSocket = get().socket
        if (currentSocket?.connected) return currentSocket
        if (get().socketConnecting) return get().socketConnectionPromise
        if (currentSocket) {
          if (currentSocket.disconnected) {
            currentSocket.connect()
          }
          return currentSocket
        }

        const connectionPromise = (async () => {
          console.log("🔌 Conectando socket...")

          try {
            console.log("🔄 Garantindo token válido...")
            const backendUrl = get().urlBancoDeDados
            await fetchComAuth(`${backendUrl}/api/me`)

            const novoSocket = io(backendUrl, {
              withCredentials: true,
              transports: ['websocket'],
              reconnection: true,
              reconnectionAttempts: 3,
              reconnectionDelay: 2000,
              timeout: 20000,
            })

            novoSocket.on("connect", () => {
              console.log("✅ Socket conectado. ID:", novoSocket.id)
              set({ socket: novoSocket })
              get().autenticarSocket()
            })

            novoSocket.on("disconnect", (reason) => {
              console.log("Socket desconectado:", reason)
              set({
                socketAuthenticatedUserId: null,
                socketAuthPendingUserId: null,
              })
            })

            // novoSocket.on("Resposta_Solicitacao_entrada_turma" , (dados)=>{
            //   alert("alguem fez uma solicitação para entrar na sua turma")
            //   buscar_notificacao()

            // })

            // novoSocket.on("notificacao_entrada_turma" , (dados)=>{
            //   alert("alguem aceitou o seu pedido de entrar na turma")
            //   buscar_turma_usuario()
            // })

            novoSocket.on("turma_ligar_aluno", (data) => {
              console.log("🔔 Nova chamada de grupo recebida:", data)
              get().setDadosChamadaGrupo(data)
              get().tocarSomChamada()
              get().setEstadoChamadaGrupo(true)
            })
            novoSocket.on("connect_error", async (err) => {
              console.log("❌ Erro socket:", err.message)
              set({
                socketAuthenticatedUserId: null,
                socketAuthPendingUserId: null,
              })

              try {
                console.log("🔄 Verificando sessão após falha do socket...")
                await fetchComAuth(`${url}/api/me`)
              } catch (e) {
                console.log("❌ Sessão expirada. Utilizador precisa de fazer login.")
              }
            })

            // --- LISTENERS GLOBAIS ---
            novoSocket.on("nova_agenda_turma" , (data)=>{
              fetch(`${url}/buscar_agenda_turma/${data.nome_Turma}/${data.id_admin_turma}`)
                .then(res=>res.json())
                .then(dados=>{
                  get().set_Dados_Agenda_Turma(dados)
                })
            })
            novoSocket.on("receber_menssagem", (data) => {
              get().marcarComoLidaSeAberto(data)
            })
            novoSocket.on("nova_aula_enviada" , (data)=>{
              alert("Boas , nova aula adicionada a tuam com sucesso!")
              fetch(`${url}/buscar_video_turma/${data.nome_turma}/${data.id_admin_turma}`)
                .then(res=> res.json())
                .then(dados=>{
                  get().set_Dados_Biblioteca_Video_Turma(dados)
                })
            })

            novoSocket.on("elimiar_menssagem_array", (data) => {
              get().elimiar_menssagem_array(data.id_menssagem, data.sala_menssagem)
            })

            novoSocket.on("editar_menssagem_array", (data) => {
              get().editar_menssagem_no_array(
                data.id_menssagem,
                data.novo_conteudo,
                data.sala_menssagem
              )
            })

            novoSocket.on("convite_turma" , (dados)=>{
              get().buscar_notificacao(dados.id_convidado)
              get().tocarSomRecebido()
            })

            novoSocket.on("confirmacao_leitura_remetente", (data) => {
              const chatAtivo = get().ChatAtivo
             
              if (chatAtivo && String(chatAtivo.nossa_sala) === String(data.nossa_sala)) {
                set((state) => ({
                  menssagens: state.menssagens.map((msg) => ({ ...msg, lida: true }))
                }))
              }
              const meuId = get().dadosUsuario?.id
              set((state) => ({
                amigos: state.amigos.map((amigo) =>
                  String(amigo.nossa_sala) === String(data.nossa_sala) &&
                  String(amigo.ultima_menssagem_remitente_id) === String(meuId)
                    ? { ...amigo, ultima_menssagem_lida: true }
                    : amigo
                )
              }))
            })

            novoSocket.on("usuario_status_alterado", (data) => {
              const { usuario_id, status } = data
              set((state) => ({
                amigos: state.amigos.map((amigo) =>
                  String(amigo.id_amigo) === String(usuario_id)
                    ? { ...amigo, status }
                    : amigo
                ),
              }))
            })

            novoSocket.on("usuario_digitando", (data) => {
              const { id_remitente, digitando , nossa_sala , ultima_menssagem } = data
              let menssagem_antiga = ""
              let menssagem_nova = ""
             
              try{
                 let sms = []
                if (digitando === true){
                  let id_escrevendo = document.getElementById(nossa_sala)
                  let classeSala = document.querySelector(`.${nossa_sala}`)
                  
                  id_escrevendo.innerHTML = "Escrevendo..."
                  classeSala.style.color = "teal"
                  classeSala.style.fontWeight = "bold"
                  menssagem_antiga = ultima_menssagem
                
                }
                else{
             
                  let classeSala = document.querySelector(`.${nossa_sala}`)
                  let sala_quantidade = document.getElementById(`GeralChatDadosObjectNewMenssage sala_${nossa_sala}`)
                  
                  try{
                   
                    if (Number(sala_quantidade.innerHTML !== 0) || Number(sala_quantidade.innerHTML) !== null){
                      classeSala.style.color = "black"
                      classeSala.style.fontWeight = "600"
                    }
                    else{
                      classeSala.style.color = "#282828"
                      classeSala.style.fontWeight = "500"
                    }
                  }
                  catch(erro){
                  
                    classeSala.style.color = "#282828"
                    classeSala.style.fontWeight = "500"
                  }
                  let id_escrevendo = document.getElementById(nossa_sala)
                  id_escrevendo.innerHTML = ultima_menssagem
                  
                 

                }
                
                
              }
              catch(erro){
                console.log("erro ao emitir a funcionalidade de escrevendo:",erro)
              }
              

              set((state) => ({
                digitandoStatus: { ...state.digitandoStatus, [id_remitente]: digitando }
              }))
            })

            novoSocket.on("response_aceitar_pedido_amizade", (data) => {
              const userId = get().dadosUsuario?.id
              if (!userId) return
              get().buscarAmigosNoBanco(userId)
              get().buscar_notificacao(userId)
              get().tocarSomRecebido()
            })

            novoSocket.on("receber_notificacao", (data) => {
              const userId = get().dadosUsuario?.id
              if (userId) {
                get().buscar_notificacao(userId)
                get().tocarSomRecebido()
              }
            })

            novoSocket.on("responsta_nova_quantidade_de_menssagem", (data) => {
              const id_amigo = data.id_amigo
              const qtd = data.quantidade_menssagem_nao_lida ?? data.quantidade
              const nossa_sala = data.nossa_sala
              const nova_menssagem = data.nova_menssagem
              get().atualizarUltimaMensagemChat(
                nossa_sala,
                nova_menssagem,
                data.horario_formatado,
                data.ultima_menssagem_remitente_id,
                data.ultima_menssagem_lida
              )
           
              if (id_amigo !== undefined && qtd !== undefined) {
                get().setQuantidadeMensagemNaoLida(id_amigo, qtd)
              }
            })

            novoSocket.on("quantidade_menssagem_nao_lida", (data) => {
              console.log("📩 Qtd não lida:", data)
              get().setMenssagemLida(data)
            })

            novoSocket.on("lista_produto_usuario_chat", (data) => {
              console.log("📦 Produtos do chat:", data)
              get().setProdutoUsuarioChat(data)
            })

            novoSocket.on("lista_de_menssagem", (data) => {
              console.log("💬 Mensagens recebidas:", data.length)
              get().setMenssagensAntigas(data)
            })

            return novoSocket
          } catch (err) {
            console.error("❌ Erro ao conectar socket - sessão expirada:", err)
            set({ socket: null })
            throw err
          }
        })()

        set({ socketConnecting: true, socketConnectionPromise: connectionPromise })

        try {
          const result = await connectionPromise
          return result
        } finally {
          set({ socketConnecting: false, socketConnectionPromise: null })
        }
      },

      limparContadorMensagens: (id_amigo) => {
        set((state) => ({
          amigos: state.amigos.map((amigo) =>
            String(amigo.id_amigo) === String(id_amigo)
              ? { ...amigo, quantidade_menssagem_nao_lida: 0 }
              : amigo
          ),
        }))
      },

      iniciarPingSessao: () => {
        const intervaloExistente = get().pingIntervalId
        if (intervaloExistente) clearInterval(intervaloExistente)

        const id = setInterval(() => {
          if (get().dadosUsuario?.id) {
            console.log("🔄 Ping para manter sessão viva...")
            fetchComAuth(`${url}/api/me`).catch(() => {})
          }
        }, 10 * 60 * 1000) // 10 minutos

        set({ pingIntervalId: id })
      },

      pararPingSessao: () => {
        const id = get().pingIntervalId
        if (id) {
          clearInterval(id)
          set({ pingIntervalId: null })
        }
      },

      logout: async () => {
        try {
          const resposta = await fetch(`${get().urlBancoDeDados}/Logout`, {
            method: "POST",
            credentials: "include"
          })
          if (!resposta.ok) {
            throw new Error(`Falha ao terminar a sessão: HTTP ${resposta.status}`)
          }
        } catch (err) {
          console.error("Erro logout:", err)
        } finally {
          const s = get().socket
          if (s) s.disconnect()

          get().pararPingSessao()

          set({
            dadosUsuario: null,
            socket: null,
            notificacoes: [],
            amigos: [],
            menssagens: [],
            digitandoStatus: {},
            ChatAtivo: null,
            ProdutoUsuario: [],
            TodosProdutos: [],
            DadosSombra: [],
            ProdutoUsuarioChat: [],
            ativar: "conteiner6"
          })
          localStorage.removeItem("user-store")
          localStorage.removeItem("token_sessao")
        }
      }
    }),

    {
      name: 'user-store',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        dadosUsuario: state.dadosUsuario,
        amigos: state.amigos,
        chatThemeId: state.chatThemeId,
        chatThemeMode: state.chatThemeMode,
        chatAnimatedSceneId: state.chatAnimatedSceneId,
      }),
    }
  )
)
