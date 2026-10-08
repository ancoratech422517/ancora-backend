
export function MenuMobileRight (setMostrarChat) {

    let conteinerRight = document.querySelector(".conteinerRight")
    let conteinerRightMenuMobile = document.querySelector(".ConteinerRightMenuMobile")
    conteinerRight.style.width = "57%"
    conteinerRightMenuMobile.style.display = "block"
    if(window.innerWidth <= 880){
        setMostrarChat(false)
        
        conteinerRightMenuMobile.style.display = "block"
        conteinerRightMenuMobile.style.width = "100%"


    }


}

export function EsconderMenuMobileRight (setMostrarChat){

    let conteinerRight = document.querySelector(".conteinerRight")
    let conteinerRightMenuMobile = document.querySelector(".ConteinerRightMenuMobile")
    conteinerRight.style.width = "72%"
    conteinerRightMenuMobile.style.display = "none"
    
    if(window.innerWidth <= 880){

        // conteinerRight.style.display = "block"
        conteinerRightMenuMobile.style.display = "none"
        conteinerRightMenuMobile.style.width = "100%"
        conteinerRight.style.width = "100%"
        setMostrarChat(true)
    }

}