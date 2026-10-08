
import { useUserStore } from "../../../useUseSotore"
const URL_BACKEND_ANCORA = useUserStore.getState().urlBancoDeDados
export async function Conteiner2ScrollDadosDeletarSms (id_notificacao , id_usuario , tipo_notificacao , setEstado) {
    
    let dados = {
        "id_notificacao":id_notificacao,
        "id_usuario":id_usuario,
        "tipo_notificacao":tipo_notificacao
    }

    const Deletar_Notificacao = await fetch(`${URL_BACKEND_ANCORA}/Deletar_Notificacao_usuario` , {
        method:"post",
        headers:{
            "Content-Type": "application/json"
        },
        body:JSON.stringify(dados)
    })
    const resposta_servidor = await Deletar_Notificacao.json()
    setEstado("buscar")



}