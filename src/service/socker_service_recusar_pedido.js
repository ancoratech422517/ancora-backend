
export function Recusar_pedido_amizade (socket , id_destinatario , dadosUsuario) {
    
    const dados = {
        "id_destinatario":id_destinatario , 
        "id_remitente":dadosUsuario.id
    }
    

    socket.emit("recusar_pedido_amizade" , dados)


}
