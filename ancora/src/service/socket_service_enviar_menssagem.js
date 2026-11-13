
import { queueChatMessage } from "./chatOfflineSync";
export function Enviar_menssagem(
    event , 
    socket , 
    nossa_sala , 
    id_amigo , 
    nome_amigo ,  
    menssagem , 
    dadosUsuario , 
    setQuantidadeMensagemNaoLida , 
    setAtivar,
    onResult,
    replyTo
)
{
    if (!nossa_sala || !dadosUsuario?.id) {
        onResult?.({ success: false, error: "Abre uma conversa e inicia sessão antes de enviar." });
        return;
    }
    const dados = {
        "nossa_sala":nossa_sala,
        "id_amigo":id_amigo,
        "nome_amigo":nome_amigo,
        "menssagem":menssagem,
        "id_remitente":dadosUsuario.id,
        "nome_remitente":dadosUsuario.nome,
        "foto_usuario": dadosUsuario.foto_usuario,
        "reply_to": replyTo ? {
            "id": replyTo.id,
            "menssagem": replyTo.menssagem,
            "nome_remitente": replyTo.nome_remitente
        } : null
    }

    void queueChatMessage(dados)
        .then(() => onResult?.({ success: true, queued: !socket?.connected || !navigator.onLine }))
        .catch((error) => {
            console.error("Não foi possível guardar a mensagem na fila offline:", error);
            onResult?.({ success: false, error: error.message || "Não foi possível guardar a mensagem." });
        });
}
