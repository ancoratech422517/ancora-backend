import { useUserStore } from "../../../../../useUseSotore"
export async function GeraChatDadosAmigos () {
    try{
        const URL_BACKEND_ANCORA = useUserStore.getState().urlBancoDeDados
        const get_lista_user = await fetch(`${URL_BACKEND_ANCORA}/usuarios/lista`)
        if (get_lista_user.ok){
            
            return await get_lista_user.json()
            
            
        } return []
    }
    catch(erro){
        console.log("erro no servidor" , erro)
    }
}
