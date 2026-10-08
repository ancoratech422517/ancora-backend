
export function ClicarButtonMarketPLaceMenuTop (even) {

    const classe = document.querySelectorAll(".Conteiner2MenuTopMarketPlaceBox2 li")
    classe.forEach((classe)=>{
        classe.classList.remove("activeBtnMarketPlaceMenuTop")
    })
    even.currentTarget.classList.add("activeBtnMarketPlaceMenuTop")

}


