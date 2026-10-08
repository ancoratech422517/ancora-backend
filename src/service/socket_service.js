import { io } from 'socket.io-client';
import { useUserStore } from '../useUseSotore';
// URL do Render sem porta
const URL_BACKEND_ANCORA = useUserStore.getState().urlBancoDeDados
const socket = io(`${URL_BACKEND_ANCORA}`, {
  transports: ['polling', 'websocket'], // ← polling PRIMEIRO
  withCredentials: true, // ← precisa pro cookie
  reconnection: true,
  reconnectionAttempts: 10,
  reconnectionDelay: 2000,
  timeout: 60000 // ← 60s pro Render acordar
});

// Log pra debugar
socket.on('connect', () => {
  console.log('✅ Socket conectado:', socket.id)
})

socket.on('connect_error', (err) => {
  console.log('❌ Erro socket:', err.message)
})

socket.on('disconnect', (reason) => {
  console.log('Socket desconectado:', reason)
})

// Função para enviar mensagem de chat
export const sendChatMessage = (messageData) => {
  socket.emit('chat_message', messageData);
};

// Função para pedido de amizade
export function solicitarAmizade(socketInstancia, dados_remitente, ID_destinatario) {
  const token = localStorage.getItem("token_sessao")
  const dados = {
      id_remitente: dados_remitente.id,
      id_destinatario: ID_destinatario,
      nome_remitente: dados_remitente.nome,
      foto_usuario:dados_remitente.foto_usuario
  }
  // Usa o socket que foi passado ou o exportado
  const s = socketInstancia || socket
  s.emit("enviar_pedido_de_amizade", dados)
}

export default socket;