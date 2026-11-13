
import { queueChatMessageDeletion } from "../../../../service/chatOfflineSync";

export function Eliminar_menssagem (event , IdMenssagem){
    const dados = {
        "id_menssagem": IdMenssagem.id_menssagem,
        "sala_menssagem":IdMenssagem.sala_menssagem,
        "id_remitente":IdMenssagem.id_remitente
    }
    void queueChatMessageDeletion(dados).catch((error) => {
        console.error("Não foi possível guardar a exclusão na fila:", error);
        alert(error.message || "Não foi possível eliminar a mensagem.");
    });
    const menu = document.querySelector(".conteinerRightMenuBottomBox");
    if (menu) menu.style.display = "none";
}