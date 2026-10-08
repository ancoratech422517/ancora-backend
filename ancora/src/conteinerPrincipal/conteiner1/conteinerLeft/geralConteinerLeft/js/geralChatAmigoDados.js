import { useUserStore } from "../../../../../useUseSotore";

export async function GeralChatAmigoDadosPerfil(id_usuario) {
    try{
        const URLBACKEND = useUserStore.getState().urlBancoDeDados
        let DADOSUSUARIO2 = useUserStore.getState().DADOSUSUARIO

        const buscar_dados_perfil_usuario = await fetch(`${URLBACKEND}/api/buscar_dados_perfill_add` , {
            method:"POST",
            headers:{
                "Content-Type":"application/json"
            },
            body:JSON.stringify({"id_usuario":id_usuario})
        })
        const resposta = await buscar_dados_perfil_usuario.json()
        
        useUserStore.setState({DADOSUSUARIO:resposta.DADOSUSUARIO})
        useUserStore.setState({DADOSPRODUTO:resposta.DADOSPRODUTO})
        useUserStore.setState({DADOSTURMA:resposta.DADOSTURMA})
        useUserStore.setState({DADOSTOTALAMIGO:resposta.DADOSTOTALAMIGO})
        useUserStore.setState({DADOSTOTALPRODUTO:resposta.DADOSTOTALPRODUTO})
        useUserStore.setState({DADOSTOTALTURMAUSUARIO:resposta.DADOSTOTALTURMAUSUARIO})
       let d=  useUserStore.getState().DADOSUSUARIO = resposta.DADOSUSUARIO

        useUserStore.getState().FotoPerfilUsuario = true
       
        
    }
    catch(erro){
        alert("erro ao buscar os dados do perfil do usuario:",erro)
    }

}