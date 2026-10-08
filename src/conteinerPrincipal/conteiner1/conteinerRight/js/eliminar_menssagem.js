
export function Eliminar_menssagem (event , IdMenssagem , socket){
    const dados = {
        "id_menssagem": IdMenssagem.id_menssagem,
        "sala_menssagem":IdMenssagem.sala_menssagem,
        "id_remitente":IdMenssagem.id_remitente
    }
    socket.emit("Eliminar_menssagem" , dados)
    document.querySelector(".conteinerRightMenuBottomBox").style.display = "none"
}