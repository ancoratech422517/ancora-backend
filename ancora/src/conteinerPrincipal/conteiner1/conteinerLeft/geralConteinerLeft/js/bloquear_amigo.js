import { useUserStore } from "../../../../../useUseSotore";

export async function Bloquear_Usuario(id_amigo , estado_bloqueado_usuario , setActualizarUsuarioBloqueado , setCONDICAOMOSTRARMENUMOBILEESTADOUSER) {
    const id_usuario = useUserStore.getState().dadosUsuario.id 
    const URLBACKEND = useUserStore.getState().urlBancoDeDados

    const dados = {
        "id_usuario":id_usuario , 
        "id_amigo":id_amigo ,
        "estado_bloqqueado_usuario": estado_bloqueado_usuario
    }

    const sendDate = await fetch(`${URLBACKEND}/api/bloquear_amigo` , {
        method:"POST" , 
        headers:{
            "Content-Type":"application/json"
        },
        body:JSON.stringify(dados)
    })

    const resposta = await sendDate.json()

    setActualizarUsuarioBloqueado(id_amigo , resposta.status)
    setCONDICAOMOSTRARMENUMOBILEESTADOUSER(false)
}
