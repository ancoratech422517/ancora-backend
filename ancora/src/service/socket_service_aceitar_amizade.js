// Remova a importação fixa se você for passar o socket da store como argumento
// import socket from "./socket_service"; 

/**
 * Função para emitir o aceite de amizade
 * @param {Object} socket - A instância vinda do useUserStore()
 * @param {Number|String} ID_destinatario - O ID de quem enviou o pedido (quem vai receber o alerta)
 * @param {Object} dadosUsuario - Os dados do usuário logado (você)
 */
export function Aceitar_pedido_amizade(socket, ID_destinatario, dadosUsuario , URLIMAGE) {
    
    // 1. Validação: Verifica se o socket existe e está conectado
    if (!socket || !socket.connected) {
        console.error("Erro: Socket não está conectado ou é inválido.");
        alert("Erro de conexão. Tente novamente.");
        return;
    }

    // 2. Validação: Verifica se os dados do usuário logado existem
    if (!dadosUsuario || !dadosUsuario.id) {
        console.error("Erro: Dados do usuário logado não encontrados.");
        return;
    }
    alert(ID_destinatario)


    // 3. Montagem do objeto conforme esperado pelo Flask
    const dados = {
        "ID_destinatario": ID_destinatario, // ID do seu amigo
        "ID_remitente": dadosUsuario.id,     // Seu ID
        "nome_remitente": dadosUsuario.nome,  // Seu Nome
        "foto_remitente":dadosUsuario.foto_usuario,
        "foto_destinatario":URLIMAGE
    };

    console.log("🚀 Enviando aceite de amizade para o servidor:", dados);

    // 4. Emissão do evento
    socket.emit("aceitar_pedido_amizade", dados);
}