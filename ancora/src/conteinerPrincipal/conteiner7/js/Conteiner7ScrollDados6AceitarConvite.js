import { useUserStore } from "../../../useUseSotore";

export async function Conteiner7Scrolldados6AceitarConviteTurma(
    id_turma_convite,
    id_usuario,
    id_admin,
    id_usuario_atual,
    id_notificacao,
    tipo_notificacao,
    setTurmaUsuario
) {
    if ([id_turma_convite, id_usuario, id_admin, id_usuario_atual, id_notificacao].some((id) => id == null)) {
        console.error("Dados incompletos para aceitar o convite/solicitacao.")
        return false
    }

    const URLBACKEND = useUserStore.getState().urlBancoDeDados
    const buscarNoficacao = useUserStore.getState().buscar_notificacao
    const SOCKET = useUserStore.getState().socket
    try {
        const respostaAceitar = await fetch(`${URLBACKEND}/aceitar_convite_turma`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                id_turma_convite,
                id_usuario,
                id_admin,
                id_notificacao,
                tipo_notificacao
            })
        })
        const resultadoAceitar = await respostaAceitar.json()

        if (!respostaAceitar.ok || resultadoAceitar.resposta !== "sucesso") {
            throw new Error(resultadoAceitar.erro || "Nao foi possivel aceitar a solicitacao.")
        }

        const respostaTurmas = await fetch(`${URLBACKEND}/buscar_turma_usuario/${id_usuario_atual}`)
        if (!respostaTurmas.ok) {
            throw new Error(`Falha ao atualizar turmas: HTTP ${respostaTurmas.status}`)
        }

        const turmas = await respostaTurmas.json()
        if (!Array.isArray(turmas)) {
            throw new Error("A API de turmas nao retornou uma lista.")
        }

        setTurmaUsuario(turmas)
        buscarNoficacao(id_usuario_atual)
        SOCKET.emit("notificar_usuario_solicirante", {"id_usuario_solicitante": id_usuario, "id_admin_turma": id_admin, "id_turma": id_turma_convite})
        return true
    } catch (erro) {
        console.error("Erro ao aceitar convite/solicitacao:", erro)
        return false
    }


}