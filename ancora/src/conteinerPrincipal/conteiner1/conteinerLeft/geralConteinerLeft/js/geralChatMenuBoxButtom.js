import { useUserStore } from "../../../../../useUseSotore";

export async function GeralChatMenuButtomBuscarDadosEstado() {
    try{
        const URLBACKEND =  useUserStore.getState().urlBancoDeDados
        const ID_USUARIO = useUserStore.getState().dadosUsuario
        

        const buscar_dados_estdo = await fetch(`${URLBACKEND}/api/buscar_dados_estado/${ID_USUARIO.id}`)
        const resposta = await buscar_dados_estdo.json()
        useUserStore.setState({ConteinerDadosEstdo:resposta})
  
  

    }
    catch(erro){
      alert(erro)
    }

}