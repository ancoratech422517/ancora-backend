import { useUserStore } from "../../../../../useUseSotore"
import { GeralChatMenuButtomBuscarDadosEstado } from "./geralChatMenuBoxButtom"
export function AoDigitarSelecionarTexto (){
    
    let GeralChatEstadoUserAddTextoGetIDTexto = document.getElementById("GeralChatEstadoUserAddTextoGetIDTexto")
    let aodigitarSelecionar = document.getElementById("aodigitarSelecionar").value 
    GeralChatEstadoUserAddTextoGetIDTexto.innerHTML = aodigitarSelecionar
}

export function AdicionarNovaDescrção(setEstadoResposta , setMostrarLoadingAdicionarEstado , setEstadoViewAdd){
    
    try{
        setMostrarLoadingAdicionarEstado(true)
        let SOCKET = useUserStore.getState().socket 
        let dados_usuario = useUserStore.getState().dadosUsuario
        let GeralChatEstadoUserAddTextoGetIDTexto = document.getElementById("GeralChatEstadoUserAddTextoGetIDTexto")
        let TIPO_ESTADO = document.getElementById("tipo-estado")
        let DADOS = {
            "id_usuario":dados_usuario.id,
            "nome_usuario":dados_usuario.nome,
            "foto_usuario":dados_usuario.foto_usuario,
            "descricao":GeralChatEstadoUserAddTextoGetIDTexto.innerHTML,
            "tipo-estado":TIPO_ESTADO.innerHTML

        }

        SOCKET.emit("Adicionar_Nova_Descricao" , DADOS)
        setTimeout(() => {
            setEstadoResposta(true)
            setMostrarLoadingAdicionarEstado(false)
            GeralChatMenuButtomBuscarDadosEstado()
        }, 3000);
        setTimeout(() => {
            setEstadoResposta(false)
            GeralChatEstadoUserAddTextoGetIDTexto.innerHTML = ""
            let aodigitarSelecionar = document.getElementById("aodigitarSelecionar").value  = ""
            setEstadoViewAdd(false)

        }, 6000);

    }
    catch(erro){
        alert(erro)
    }

}

export function GeralChatEstadoUserAddMusicaAoDigitarDescricao () {

    let conteiner_descricao_musicaID = document.getElementById("conteiner_descricao_musicaID")
    let descricao_musica = document.getElementById("descricao_musica")

    conteiner_descricao_musicaID.innerHTML = descricao_musica.value 

}

export async function GeralChatEstadoUserAddMusicaSendEstado(setEstadoResposta , setMostrarLoadingAdicionarEstado , setEstadoViewAdd){
    try{    setMostrarLoadingAdicionarEstado(true)
            let conteiner_descricao_musicaID = document.getElementById("conteiner_descricao_musicaID")
            let musica_estado = document.getElementById("musica_estado")
            let tipo_musica = document.getElementById("tipo-musica")
            let dados_usuario = useUserStore.getState().dadosUsuario
            let URLBACKEND = useUserStore.getState().urlBancoDeDados
            

            const form_data = new FormData()

            if (musica_estado.files.length > 0){
                form_data.append("musica_estado" , musica_estado.files[0])
                form_data.append("id_usuario" , dados_usuario.id)
                form_data.append("nome_usuario" , dados_usuario.nome)
                form_data.append("foto_usuario" , dados_usuario.foto_usuario)
                form_data.append("conteiner_descricao_musicaID" , conteiner_descricao_musicaID.innerHTML)
                form_data.append("tipo_musica" , tipo_musica.innerHTML)
            }

            const adicionarEstadoMusica = await fetch(`${URLBACKEND}/api/adicionar_estado_musica` , {
                method:"POST",
                body: form_data
            })

            const respostaEstadoMusica = await adicionarEstadoMusica.json()
            alert(respostaEstadoMusica.resposta)
            setTimeout(() => {
                setEstadoResposta(true)
                setMostrarLoadingAdicionarEstado(false)
                GeralChatMenuButtomBuscarDadosEstado ()
            }, 3000);

            setTimeout(() => {
                setEstadoResposta(false)
                setEstadoViewAdd(false)

            }, 5000);

    }
    catch(erro){
        alert(erro)
    }


}

export function GeralChatEstadoUserAddImagemAoDigitar (){
    let GeralChatEstadoUserAddImagemDigitar = document.getElementById("GeralChatEstadoUserAddImagemDigitar")
    let texto_imagem_estado = document.getElementById("texto_imagem_estado")
    GeralChatEstadoUserAddImagemDigitar.innerHTML = texto_imagem_estado.value
}

export async function GeralChatEstadoUserAddImagemAoDigitarDate(setMostrarLoadingAdicionarEstado , setEstadoResposta , setEstadoViewAdd) {
    try{setMostrarLoadingAdicionarEstado(true)
        const URLBACKEND = useUserStore.getState().urlBancoDeDados
        const dados_usuario = useUserStore.getState().dadosUsuario
        let GeralChatEstadoUserAddImagemDigitar = document.getElementById("GeralChatEstadoUserAddImagemDigitar")
        let imagem_estado = document.getElementById("imagem_estado")
        
        if (imagem_estado.files.length<0){
            alert("tens que selecionar uma imagem")
            return
        }
        const my_formData = new FormData()
        my_formData.append("nome_usuario" , dados_usuario.nome)
        my_formData.append("foto_usuario" , dados_usuario.foto_usuario)
        my_formData.append("id_usuario" , dados_usuario.id)
        my_formData.append("descricao_imagem" ,GeralChatEstadoUserAddImagemDigitar.innerHTML)
        my_formData.append("imagem_estado" , imagem_estado.files[0])
        my_formData.append("tipo_estado" , "imagem")

        const enviar_estado_imagem = await fetch(`${URLBACKEND}/api/enviar_imagem_estado` , {
            method:"POST",
            body: my_formData
        })
        const resposta = await enviar_estado_imagem.json()
        setTimeout(() => {
            setEstadoResposta(true)
            setMostrarLoadingAdicionarEstado(false)
            GeralChatMenuButtomBuscarDadosEstado ()
        }, 2000);
        setTimeout(() => {
            setEstadoViewAdd(false)
            setEstadoResposta(false)
        }, 4000);
    }
    catch(erro){
        setEstadoViewAdd(false)
        setMostrarLoadingAdicionarEstado(false)
        setEstadoResposta(false)
        alert(erro)
    }

}

export function GeralCharUserAddTextoAoDigitarVideo () {
    let textoVideo = document.getElementById("textoVideo")
    let descricao_video = document.getElementById("descricao_video")

    textoVideo.innerHTML = descricao_video.value
}

export async function GeralChatUserAddTextoAoDigitarVideoSendVideo(setEstadoResposta , setMostrarLoadingAdicionarEstado , setEstadoViewAdd) {
    try{
        setMostrarLoadingAdicionarEstado(true)
        const URLBACKEND = useUserStore.getState().urlBancoDeDados
        const dados_usuario = useUserStore.getState().dadosUsuario
        const descricao_video = document.getElementById("textoVideo")
        const video_estado = document.getElementById("video_estado")

        if (video_estado.files.length < 0){
            alert("tens que selecionae um video")
            return
        }

        let my_formData = new FormData()
        my_formData.append("nome_usuario" , dados_usuario.nome)
        my_formData.append("id_usuario" , dados_usuario.id)
        my_formData.append("foto_usuario" , dados_usuario.foto_usuario)
        my_formData.append("descricao_video" , descricao_video.innerHTML)
        my_formData.append("video_estado" , video_estado.files[0])
        my_formData.append("tipo_estado" , "video")

        const enviar_estado = await fetch(`${URLBACKEND}/api/enviar_video_estado` , {
            method:"POST",
            body:my_formData
        })

        const resposta = await enviar_estado.json()
        setTimeout(() => {
           setEstadoResposta(true)
           setMostrarLoadingAdicionarEstado(false)
           GeralChatMenuButtomBuscarDadosEstado ()

        }, 2000);
        setTimeout(() => {
            setEstadoResposta(false)
            setEstadoViewAdd(false)
        }, 5000);

    }
    catch(erro){
        alert(erro)
        setEstadoViewAdd(false)
    }
    

}