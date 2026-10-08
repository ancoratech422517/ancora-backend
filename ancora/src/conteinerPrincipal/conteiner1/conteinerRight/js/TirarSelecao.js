
export function TirarSelecao () {
                const dados = document.querySelectorAll(".ConteinerRightDadosWindowMenssageMim")
                dados.forEach((dados) =>{
                    dados.classList.remove("ativar_selecao_menssagem")
                })
                document.querySelector(".conteinerRightMenuBottomBox").style.display = "none"
}