
export function Clicado (even , mudarTela , nomeDaTela) {
    let remover = document.querySelectorAll(".Conteiner4RightWindowMenuTopBoxBottom li")
    remover.forEach((remover) =>{
        remover.classList.remove("ativoMenuTopRight4")
    })
    even.currentTarget.classList.add("ativoMenuTopRight4")

    if (mudarTela){
        mudarTela(nomeDaTela)
    }

}
