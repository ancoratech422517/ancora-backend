import { useUserStore } from "../../../../useUseSotore";
export async function MenuMobileConvidarUsuarioTurma(id_usuario , id_turma , id_convidado , socket , setEstadoMenssageResposta , set_texto_menssagem_resposta , nome_Turma) {
    const URLBACKEND = useUserStore.getState().urlBancoDeDados
    const dados = {
        "id_usuario":id_usuario,
        "id_turma":id_turma,
        "id_convidado":id_convidado,
        "nome_Turma":nome_Turma
    }

    const convidar_usuario = await fetch(`${URLBACKEND}/convidar_usuario_turma` , {
        method:"POST",
        headers:{
            "Content-Type":"application/json"
        },
        body: JSON.stringify(dados)
    })
    const getResponse = await convidar_usuario.json()
    if (getResponse){
        setTimeout(() => {
            setEstadoMenssageResposta(true)
            set_texto_menssagem_resposta(getResponse.resposta)
            if (getResponse.resposta === "convite enviado"){
                socket.emit("convidar_usuario_turma" , dados)
            }
            
        }, 400);
        setTimeout(() => {
            setEstadoMenssageResposta(false)
        }, 2000);
    }

}