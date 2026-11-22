
import { useUserStore } from "../../../useUseSotore"
export async function CloseSombraCard(dados , setDadosSombra , setEstado){
    const dadosUser = useUserStore.getState().dadosUsuario
    const URLBACKEND_ANCORA = useUserStore.getState().urlBancoDeDados
    let CloseCardSombra = document.querySelector(".Conteiner2RightWindowProdutsSombra")
    if (!dados || CloseCardSombra.style.display === "flex"){
        CloseCardSombra.style.display = "none"
        setEstado?.("produto")
        return
    }

    CloseCardSombra.style.display = "flex"
    setDadosSombra(dados)
    const send_estado = await fetch(`${URLBACKEND_ANCORA}/visto_usuario` , {
        method: "post" , 
        headers:{
            "Content-Type":"application/json"
        },
        body: JSON.stringify({"id_usuario":dadosUser.id , "id_produto":dados.id})
    })
    await send_estado.json()


}


