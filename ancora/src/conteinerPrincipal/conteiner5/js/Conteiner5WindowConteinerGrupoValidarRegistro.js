import {useUserStore} from "../../../useUseSotore"

export async function Conteiner5WindowConteinerGrupoValidarRegistro (setGrupo , setTurmaUsuario , id_usuario , set_mostrar_loading_grupo) {
    set_mostrar_loading_grupo(true)
    const URLBACKEND = useUserStore.getState().urlBancoDeDados
    const DadosUsuario = useUserStore.getState().dadosUsuario
    const nome_turma = document.getElementById("nome_turma").value
    const img_turma = document.getElementById("img").files[0]
    if (!img_turma) {
        alert("Por favor, selecione uma imagem para a turma.")
        return
    }
    const formData = new FormData()
    formData.append("nome_turma", nome_turma)
    formData.append("img_turma", img_turma)
    formData.append("id_admin", DadosUsuario.id)

    const ValidarRegistroTurma = await fetch(`${URLBACKEND}/validar-registro-turma`, {
        method: "POST",
        body: formData
    })
    const getResponse = await ValidarRegistroTurma.json()

    setGrupo(false)
    fetch(`${URLBACKEND}/buscar_turma_usuario/${id_usuario}`)
    .then(res => res.json())
    .then(dados =>{
        setTurmaUsuario(dados)
    })
    setTimeout(() => {
        set_mostrar_loading_grupo(false)
        alert("turma criada com sucesso!")
    }, 1000);
}