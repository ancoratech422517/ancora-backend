import { useUserStore } from "../../../../../useUseSotore";

export async function Exluir_Amigo(id_amigo , estado_Exluido_usuario , setActualizarUsuarioExluido , setCONDICAOMOSTRARMENUMOBILEESTADOUSER) {
    const URLBACKEND = useUserStore.getState().urlBancoDeDados
    const id_usuario = useUserStore.getState().dadosUsuario.id 

    const dados = {
        "id_usuario":id_usuario , 
        "id_amigo":id_amigo ,
        "estado_exluido_usuario":estado_Exluido_usuario

    }

    const sendDate = await fetch(`${URLBACKEND}/api/exluir_amigo` , {
        method:"POST" , 
        headers:{
            "Content-Type":"application/json"
        } ,
        body:JSON.stringify(dados)
    })
    
    const resposta = await sendDate.json()
    setActualizarUsuarioExluido(id_amigo , resposta.status)
    setCONDICAOMOSTRARMENUMOBILEESTADOUSER(false)
    alert(resposta.resposta)

}