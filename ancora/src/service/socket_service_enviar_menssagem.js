
import { useUserStore } from "../useUseSotore";
export function Enviar_menssagem(
    event , 
    socket , 
    nossa_sala , 
    id_amigo , 
    nome_amigo ,  
    menssagem , 
    dadosUsuario , 
    setQuantidadeMensagemNaoLida , 
    setAtivar
)
{
    if (!socket || !nossa_sala) return;
    const dados = {
        "nossa_sala":nossa_sala,
        "id_amigo":id_amigo,
        "nome_amigo":nome_amigo,
        "menssagem":menssagem,
        "id_remitente":dadosUsuario.id,
        "nome_remitente":dadosUsuario.nome
    }

    socket.emit("enviar_menssagem_na_sala" , dados)
    socket.emit("nova_quantidade_de_menssagem" , dados)
    let negritar = useUserStore.getState().Negritar
    try{
        let nossSala = document.getElementById(nossa_sala).innerHTML = menssagem
        const horaMinuto  = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        let horaMenssagem = document.getElementById(`hora_mensagem_${nossa_sala}`).innerHTML = horaMinuto
         let index = `index_${nossa_sala}`
        let GeralChatDados = document.getElementById(index)
        let GeralChatUsuario = document.getElementById("GeralChatUsuario")
        if(GeralChatDados && GeralChatUsuario){
            GeralChatUsuario.prepend(GeralChatDados)
        }

    }
    catch(erro){
        console.log("erro")
    }
    

}
