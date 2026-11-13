import { useUserStore } from "../../../useUseSotore";
import { fetchComAuth } from "../../../utils/api";
export async function Conteiner7ScrollDadosRecusarConvite (id_turma , id_usuario){
    
    const URLBACKEND = useUserStore.getState().urlBancoDeDados
    const buscarNoficacao = useUserStore.getState().buscar_notificacao
    try {
        const Recusar_Convite = await fetchComAuth(`${URLBACKEND}/recusar_convite_turma` , {
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
    } catch (error) {
        if (error?.queued) return true
        throw error
    }
}