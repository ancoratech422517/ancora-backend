
export function GeralChatMenuButtomText (e){
    let GeralChatMenuButtomTextClasse = document.querySelectorAll(".GeralChatMenuButtomText")

    GeralChatMenuButtomTextClasse.forEach((classe)=>{
        classe.classList.remove("ativar_opcao")
    })
    e.currentTarget.classList.add("ativar_opcao")
}