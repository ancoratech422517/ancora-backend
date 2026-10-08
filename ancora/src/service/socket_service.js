import { useUserStore } from '../useUseSotore'

export function getSocketAtual() {
  const { socket, conectarSocket } = useUserStore.getState()

  if (socket?.connected) return socket

  if (socket) return socket

  conectarSocket?.()

  return useUserStore.getState().socket
}

export const sendChatMessage = (messageData) => {
  const socket = getSocketAtual()
  if (!socket) return
  socket.emit('chat_message', messageData)
}

export function solicitarAmizade(socketInstancia, dados_remitente, ID_destinatario) {
  const socket = socketInstancia || getSocketAtual()

  if (!socket || !socket.connected) {
    console.warn('Socket indisponível para enviar pedido de amizade.')
    return
  }

  const dados = {
    id_remitente: dados_remitente.id,
    id_destinatario: ID_destinatario,
    nome_remitente: dados_remitente.nome,
    foto_usuario: dados_remitente.foto_usuario
  }

  socket.emit('enviar_pedido_de_amizade', dados)
  let classe = `flex_${ID_destinatario}`
  const elemento = document.querySelector(`.${classe}`)
  if (elemento) {
    elemento.style.display = 'flex'
  }
  setTimeout(()=>{
    if (elemento) {
      elemento.style.display = 'none'
    }
  }, 2000)
}

export default getSocketAtual
