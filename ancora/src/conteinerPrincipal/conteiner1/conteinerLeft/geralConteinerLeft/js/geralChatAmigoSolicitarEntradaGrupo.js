import { useUserStore } from "../../../../../useUseSotore";

export function GeralChatAmigoSolicitarEntradaGrupo(id_usuario_solicitante , nome_usuario_solicitante , foto_usuario_solicitante , id_admin , id_turma , nome_turma ) {
    const SOCKET = useUserStore.getState().socket 

    if (!SOCKET?.connected) {
        console.warn("Socket indisponível para solicitar entrada na turma.")
        return
    }

    const dados = {
        "id_usuario_solicitante":id_usuario_solicitante,
        "nome_usuario_solicitante":nome_usuario_solicitante,
        "foto_usuario_solicitante":foto_usuario_solicitante,
        "id_admin_turma":id_admin,
        "id_turma":id_turma,
        "nome_turma":nome_turma
    }

    SOCKET.emit("Solicitar_entrada_grupo" , dados )

    const elemento = document.querySelector(`.aviso_solicitacao_turma_${id_turma}`)
    if (elemento) {
        elemento.style.display = "flex"
        setTimeout(() => {
            elemento.style.display = "none"
        }, 2000)
    }

}
