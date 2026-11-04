import { useUserStore } from "../../../../../useUseSotore";

export async function GeralChatUsuarioPrivadoConteinerPai() {
    const URLBACKEND = useUserStore.getState().urlBancoDeDados
    const telefone_credencias = document.getElementById("telefone-credencias").value
    const senha_credencias = document.getElementById("senha-credencias").value
    let GeralChatUsuarioPrivado = document.querySelector(".GeralChatUsuarioPrivado")

    const dados = {
        "senha_credencias":senha_credencias,
        "telefone_credencias":telefone_credencias
    }

    const sendDAte = await fetch(`${URLBACKEND}/api/mensagem_privado_autentificacao` , {
        method:"POST" , 
        headers:{
            "Content-Type":"application/json"
        },
        body:JSON.stringify(dados)
    })
    const resposta = await sendDAte.json()
    if (resposta.resposta === true){
        GeralChatUsuarioPrivado.style.display = "none"
    }
    else{
        alert(resposta.message)
    }
}