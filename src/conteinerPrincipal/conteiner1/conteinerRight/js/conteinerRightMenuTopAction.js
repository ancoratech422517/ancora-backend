

export function Back_home (socket , nossa_sala , setMostrarChat){
    if (window.innerWidth <= 700){
        document.querySelector(".conteinerLeft").style.display = "block"
        document.querySelector(".menuConteinerLeft").style.display = "flex"
        let conteiner_left = document.querySelector(".conteiner1")
        conteiner_left.style.width = "100%"
        conteiner_left.style.height = "90%"
        socket.emit("sair_da_sala" , {"nossa_sala":nossa_sala})

        const dados = document.querySelectorAll(".GeralChatDados")
        dados.forEach((dados)=>{
        dados.classList.remove("dadosActive")
        setMostrarChat(false)
        })

    }
}