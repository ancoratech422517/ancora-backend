import {useUserStore} from "../../../useUseSotore"
import { optimizeImage } from "../../../utils/imageOptimizer";
import { fetchComAuth } from "../../../utils/api";

export async function Conteiner5WindowConteinerGrupoValidarRegistro (setGrupo , setTurmaUsuario , id_usuario , set_mostrar_loading_grupo) {
    set_mostrar_loading_grupo(true)
    const URLBACKEND = useUserStore.getState().urlBancoDeDados
    const DadosUsuario = useUserStore.getState().dadosUsuario
    const nome_turma = document.getElementById("nome_turma").value
    const selectedImage = document.getElementById("img").files[0]
    if (!selectedImage) {
        set_mostrar_loading_grupo(false)
        alert("Por favor, selecione uma imagem para a turma.")
        return
    }
    let img_turma
    let imagemBlurHash = null
    try {
        const optimized = await optimizeImage(selectedImage, "avatar")
        img_turma = optimized.file
        imagemBlurHash = optimized.blurHash
    } catch (error) {
        console.error("Não foi possível otimizar a imagem da turma:", error)
        set_mostrar_loading_grupo(false)
        alert(error.message || "Não foi possível preparar a imagem da turma.")
        return
    }
    const formData = new FormData()
    formData.append("nome_turma", nome_turma)
    formData.append("img_turma", img_turma)
    formData.append("id_admin", DadosUsuario.id)
    formData.append("imagem_blurhash", imagemBlurHash || "")

    try {
        const response = await fetchComAuth(`${URLBACKEND}/validar-registro-turma`, {
            method: "POST",
            body: formData
        })
        const responseData = await response.json()
        if (!response.ok) {
            throw new Error(responseData.error || responseData.message || "Não foi possível criar a turma.")
        }

        setGrupo(false)
        try {
            const turmasResponse = await fetchComAuth(`${URLBACKEND}/buscar_turma_usuario/${id_usuario}`)
            if (!turmasResponse.ok) {
                throw new Error("O servidor não conseguiu atualizar a lista.")
            }
            setTurmaUsuario(await turmasResponse.json())
        } catch (refreshError) {
            console.error("Turma criada, mas a lista não foi atualizada:", refreshError)
            set_mostrar_loading_grupo(false)
            alert("Turma criada, mas não foi possível atualizar a lista. Recarrega para a visualizar.")
            return
        }
        set_mostrar_loading_grupo(false)
        alert(responseData.message || "Turma criada com sucesso!")
    } catch (error) {
        console.error("Não foi possível criar a turma:", error)
        set_mostrar_loading_grupo(false)
        alert(error.message || "Não foi possível criar a turma.")
    }
}