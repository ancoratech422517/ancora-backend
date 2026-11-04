import { useUserStore } from "../../../../../useUseSotore";

export async function TrancarConversaUsuario(id_amido , estado_privado_usuario ,  setActualizarEstadoPrivado , setCONDICAOMOSTRARMENUMOBILEESTADOUSER) {
   
    const URLBACKEND = useUserStore.getState().urlBancoDeDados
    const id_udusaio = useUserStore.getState().dadosUsuario.id

    const dados = {
        "id_usuario":id_udusaio , 
        "id_amigo":id_amido , 
        "estado_privado_usuario":estado_privado_usuario
    }

    const sendDate = await fetch(`${URLBACKEND}/api/trancar_conversa` , {
        method:"POST" ,
        headers:{
            "Content-Type":"application/json"
        },
        body:JSON.stringify(dados)
    })

    const resposta = await sendDate.json()
     setActualizarEstadoPrivado(id_amido , resposta.estado_privado)
     setCONDICAOMOSTRARMENUMOBILEESTADOUSER(false)
    

}