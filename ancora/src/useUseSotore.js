import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { io } from 'socket.io-client'
import { fetchComAuth } from './utils/api'
let url2 = "https://backend-1-g6ty.onrender.com"
let url = "http://127.0.0.1:5000"
export const useUserStore = create(
  
  persist( 
    (set, get) => ({
      urlBancoDeDados: url,
      dadosUsuario: null,
      socket: null,
      socketConnecting: false,
      socketConnectionPromise: null,
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
        const audio = new Audio('/sounds/chamada.mp3')
        audio.volume = 0.6
        audio.loop = true
        audio.play().catch(err => console.log("Erro som chamada:", err))
        set({audioChamada:audio})
      },

      pararSomChamada: () =>{
        const {audioChamada} = get()
        if (audioChamada){
          audioChamada.pause()
          audioChamada.currentTime = 0
          set({audioChamada:null})
        }

      },

      // --- SETTERS ---
      setDados: (dados) => set({ dadosUsuario: dados }),
      setSocket: (socket) => set({ socket }),
      setNotificacoes: (lista) => set({ notificacoes: lista }),
      setAmigos: (amigo) => set({ amigos: amigo }),
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
      setMenssagem: (msg) => set((state) => ({ menssagens: [...state.menssagens, msg] })),
      limparMensagens: () => set({ menssagens: [] }),
      setMenssagensAntigas: (novasMenssagens) => set({ menssagens: novasMenssagens }),
      setChatAtivo: (dadosChatAtivo) => set({ ChatAtivo: dadosChatAtivo, menssagens: [] }),
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
        return { menssagens: novasMensagens }
      }),
      // AQUI ESTAS A ACTUALIZAR A MENSSAGEM DO CHAT DE CONVERSA FOCA-TE NO PONTO CRUCIAL , PORUQE ESTOU A USAR MAPAEAMENTO 
      editar_menssagem_no_array: (id, novoConteudo) => {
        const mensagensAtuais = get().menssagens
        if (mensagensAtuais.length === 0) return
        const novasMensagens = mensagensAtuais.map((msg) => {
          if (String(msg.id) === String(id)) {
            return { ...msg, menssagem: novoConteudo }
          }
          return msg
        })
        set({ menssagens: [...novasMensagens] })
      },

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
            await fetchComAuth(`${url}/api/me`)

            const novoSocket = io(url, {
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
            })

            novoSocket.on("disconnect", (reason) => {
              console.log("Socket desconectado:", reason)
              set({ socket: null })
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
              get().tocarSomChamada()
             get().setEstadoChamadaGrupo(true)
          
              alert("Nova chamada de grupo recebida! Sala: " + data.sala_Turma)
            })
            novoSocket.on("connect_error", async (err) => {
              console.log("❌ Erro socket:", err.message)
              set({ socket: null })

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
              get().editar_menssagem_no_array(data.id_menssagem, data.novo_conteudo)
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
                      classeSala.style.color = "#6b7280"
                      classeSala.style.fontWeight = "500"
                    }
                  }
                  catch(erro){
                  
                    classeSala.style.color = "#6b7280"
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
              // -----------------------------------------------------------
              let index = `index_${data.nossa_sala}`
              let GeralChatDados = document.getElementById(index)
              let GeralChatUsuario = document.getElementById("GeralChatUsuario")
              if(GeralChatDados && GeralChatUsuario){
                  GeralChatUsuario.prepend(GeralChatDados)
              }
              // ----------------------------------------------------------------
              
              try{
                let hora_mensagem = document.getElementById(`hora_mensagem_${data.nossa_sala}`)
                
                hora_mensagem.innerHTML = data.horario_formatado

                const sala_user_amigo = document.getElementById(nossa_sala).innerHTML = nova_menssagem
                let classeSala = document.querySelector(`.${data.nossa_sala}`)
                classeSala.style.color = "black"
                classeSala.style.fontWeight = "600"
              }
              catch(erro){
                console.log("erro ao adicionar a nova mensagem:" , erro)
              }
           
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
          await fetch(`${url}/Logout`, {
            method: "POST",
            credentials: "include"
          })
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
            ProdutoUsuarioChat: []
          })
        }
      }
    }),

    {
      name: 'user-store',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        dadosUsuario: state.dadosUsuario
      }),
    }
  )
)