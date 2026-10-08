import { useUserStore } from "../../../useUseSotore";
export async function Conteiner7ScrollDadosRecusarConvite (id_turma , id_usuario){
    
    const URLBACKEND = useUserStore.getState().urlBancoDeDados
    const buscarNoficacao = useUserStore.getState().buscar_notificacao
    const Recusar_Convite = await fetch(`${URLBACKEND}/recusar_convite_turma` , {
        method:"POST",
        headers:{
            "Content-Type":"application/json"
        },
        body:JSON.stringify({"id_turma":id_turma})
    })
    const resposta = await Recusar_Convite.json()
    if(resposta){
        buscarNoficacao(id_usuario)
    }
}