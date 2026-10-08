import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { io } from 'socket.io-client'
import { fetchComAuth } from './utils/api'

let url = "https://backend-1-g6ty.onrender.com"

export const useUserStore = create(
  
  persist(
    (set, get) => ({
      dadosUsuario: null,
      socket: null,
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
      urlBancoDeDados: url,
      estadoMenu: "none",
      ativar: "conteiner8",
      MostrarProdutoTrafego: "false",
      dadosTrafego: [],
      trafegoEscolhido: [],
      estadoConteinerDeposito: "False",
      TextoAmigo:"Adicionar",

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
        if (currentSocket?.connected) return
        if (currentSocket) {
          currentSocket.connect()
          return
        }

        console.log("🔌 Conectando socket...")

        try {
          console.log("🔄 Garantindo token válido...")
          await fetchComAuth(`${url}/api/me`)

          const novoSocket = io(url, {
            withCredentials: true,
            transports: ['polling', 'websocket'],
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
          })

          novoSocket.on("connect", () => {
            console.log("✅ Socket conectado. ID:", novoSocket.id)
            set({ socket: novoSocket })
          })

          novoSocket.on("disconnect", (reason) => {
            console.log("Socket desconectado:", reason)
            set({ socket: null })
          })

          novoSocket.on("connect_error", async (err) => {
            console.log("❌ Erro socket:", err.message)
            try {
              console.log("🔄 Tentando renovar token...")
              await fetchComAuth(`${url}/api/me`)
              console.log("✅ Token renovado, reconectando...")
              novoSocket.connect()
            } catch (e) {
              console.log("❌ Sessão expirada. Utilizador precisa de fazer login.")
              set({ socket: null })
            }
          })

          // --- LISTENERS GLOBAIS ---
          novoSocket.on("receber_menssagem", (data) => {
            get().marcarComoLidaSeAberto(data)
          })

          novoSocket.on("elimiar_menssagem_array", (data) => {
            get().elimiar_menssagem_array(data.id_menssagem, data.sala_menssagem)
          })

          novoSocket.on("editar_menssagem_array", (data) => {
            get().editar_menssagem_no_array(data.id_menssagem, data.novo_conteudo)
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
            const { id_remitente, digitando } = data
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

        } catch (err) {
          console.error("❌ Erro ao conectar socket - sessão expirada:", err)
          set({ socket: null })
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
