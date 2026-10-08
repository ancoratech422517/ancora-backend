

export function Selecionar_menssagem (event , id_menssagem , sala_menssagem , id_remitente, setIdMenssagem) {
    const dados = document.querySelectorAll(".ConteinerRightDadosWindowMenssageMim")
    dados.forEach((dados) =>{
        dados.classList.remove("ativar_selecao_menssagem")
    })
    event.currentTarget.classList.add("ativar_selecao_menssagem")
    const dados_menssagem_mim = {
        "id_menssagem":id_menssagem,
        "sala_menssagem": sala_menssagem,
        "id_remitente":id_remitente
    }
    setIdMenssagem(dados_menssagem_mim)
    document.querySelector(".conteinerRightMenuBottomBox").style.display = "flex"
    
    
}