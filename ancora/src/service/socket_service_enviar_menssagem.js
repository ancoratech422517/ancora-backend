
import { useUserStore } from "../useUseSotore";
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
    if (!socket || !nossa_sala) return;
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

    socket.emit("enviar_menssagem_na_sala" , dados, (result) => onResult?.(result))
    socket.emit("nova_quantidade_de_menssagem" , dados)
    const horaMensagem = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    useUserStore.getState().atualizarUltimaMensagemChat(
        nossa_sala,
        menssagem,
        horaMensagem,
        dadosUsuario.id,
        false
    );
}
