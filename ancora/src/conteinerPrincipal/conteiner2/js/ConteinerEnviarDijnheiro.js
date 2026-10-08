import { useUserStore } from "../../../useUseSotore"
export async function ConteinerComprarProduto (DadosCompraVendedor , dadosUsuario , setLoad , setEscolha_load , setResposta , socket , setEstadoNoti , setEstadoNotificacao){
    const URL_BACKEND_ANCORA = useUserStore.getState().urlBancoDeDados
    const terminal_multicaixa_cliente = document.getElementById("terminal_multicaixa").value 
    let resposta_pagamento = document.getElementById("resposta_pagamento")
    const dadosProduto = {
        "nome_produto":DadosCompraVendedor.nome_produto,
        "preco_produto":DadosCompraVendedor.preco_produto,
        "nome_cliente":dadosUsuario.nome,
        "id_cliente":dadosUsuario.id,
        "id_usuario_vendedor":DadosCompraVendedor.id_usuario,
        "telefone_conta_cliente":terminal_multicaixa_cliente,
        "urlImage":DadosCompraVendedor.urlImage
        
    }
    const send = await fetch(`${URL_BACKEND_ANCORA}/ComprarProduto` , {
        method: "post" , 
        headers:{
            "Content-Type": "application/json"
        },
        body: JSON.stringify(dadosProduto)
    })
    setLoad("true")
    const resposta = await send.json()
    setResposta(resposta.status)

    setTimeout(() => {
        setEscolha_load("resposta")
        setEstadoNoti("ativo")

    }, 2000);
    const dados_servidor = resposta.dados

    socket.emit("notificar_compra_usuario" , dados_servidor)


    socket.on("notificar_usuario_compra_produto" , (data)=>{
        setEstadoNotificacao("True")
   
    })
    

    // socket.on("notificar_usuario_compra_produto" , (data)=>{
    //     alert(data.remetente_id)
    // })

    


}


