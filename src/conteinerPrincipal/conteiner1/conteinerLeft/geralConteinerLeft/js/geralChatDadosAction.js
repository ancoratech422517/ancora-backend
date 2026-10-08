
export function DadosActive (event , nome_amigo , id_amigo, nossa_sala , foto_amigo, setChatAtivo , socket , id_remitente , nome_remitente , foto_usuario , sala_antiga , setMenssagemLida , setProdutoUsuarioChat , setMostrarChat){
    let conteiner_left = document.querySelector(".conteiner1")
    if (window.innerWidth <= 700){
        document.querySelector(".conteinerLeft").style.display = "none"
        document.querySelector(".menuConteinerLeft").style.display = "none"
        setMostrarChat(true)
        document.querySelector(".conteiner1").style.height = "100%"
        
        conteiner_left.style.width = "100%"
        
    }
    const dados = document.querySelectorAll(".GeralChatDados")
    dados.forEach((dados)=>{
        dados.classList.remove("dadosActive")
    })
    event.currentTarget.classList.add("dadosActive");

    const dados_amigo = {
        "nome_amigo":nome_amigo,
        "id_amigo":id_amigo,
        "nossa_sala":nossa_sala,
        "foto_amigo":foto_amigo,
        "id_remitente":id_remitente,
        "nome_remitente": nome_remitente,
        "foto_usuario":foto_usuario,
        "sala_antiga":sala_antiga

    }
    
    socket.emit("buscar_menssagens" , {"nossa_sala":nossa_sala})

    socket.emit("menssagem_visualizada" , dados_amigo)
    socket.on("quantidade_menssagem_nao_lida" , (data)=>{
        setMenssagemLida(data)

    })
    socket.on("lista_produto_usuario_chat" , (data)=>{
        setProdutoUsuarioChat(data)
    })
    

    if(setChatAtivo){
        setChatAtivo(dados_amigo)
    }
    socket.emit("Entrar_na_sala" , dados_amigo)

}
