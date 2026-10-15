

export function Enviar_menssagem(event , socket , nossa_sala , id_amigo , nome_amigo ,  menssagem , dadosUsuario , setQuantidadeMensagemNaoLida , setAtivar, onResult){
    if (!socket || !nossa_sala) return;
    const dados = {
        "nossa_sala":nossa_sala,
        "id_amigo":id_amigo,
        "nome_amigo":nome_amigo,
        "menssagem":menssagem,
        "id_remitente":dadosUsuario.id,
        "nome_remitente":dadosUsuario.nome
    }
    socket.emit("enviar_menssagem_na_sala" , dados, (result) => onResult?.(result))
    socket.emit("nova_quantidade_de_menssagem" , dados)


}