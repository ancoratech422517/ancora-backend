import { useUserStore } from "../../../useUseSotore"
export async function Actualizar_foto_Perfil (id_usuario , setEstadoFoto , setValorFoto){
    const URL_BACKEND_ANCORA = useUserStore.getState().urlBancoDeDados
    let foto = document.getElementById("foto")
    let labelFoto = document.querySelector(".labelFoto")

    if (!foto || foto.files.length === 0 ){
        console.log()
    }
    
    else{
        
        let arquivo = foto.files[0]
        
        let form_data = new FormData()
        form_data.append("foto" , arquivo)
        form_data.append("id_usuario" , id_usuario)

        try{
            const actualizar_foto = await fetch(`${URL_BACKEND_ANCORA}/actualizar_foto_perfil` , {
                method: "POST" , 
                body: form_data
            })
            const respostaGet = await actualizar_foto.json()

            setEstadoFoto("image")
            setValorFoto(respostaGet.imagem)
            
        }
        catch (erro){
            console.log(erro)
        }

    }

}
// FORA DA FUNÇÃO
Actualizar_foto_Perfil()
