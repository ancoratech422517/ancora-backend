import { useState } from "react";
import "./css/Conteiner2RightWindowProdutsSombraCard.css"
import { CloseSombraCard } from "./js/Conteiner2SomraCard";
import { useUserStore } from "../../useUseSotore";
import ImageDefault from "../../assets/image_card.png"
import { Enviar_menssagem } from "../../service/socket_service_enviar_menssagem";

export default function Conteiner2RightWindowProdutsSombraCard ({setEstado}) {

    const { DadosSombra, dadosUsuario, socket  , setEstadoCompra , setDadosCompraVendedor , DadosCompraVendedor , urlBancoDeDados , setAtivar} = useUserStore()
    let valor = "none"
    if (DadosSombra.foto_vendedor !== "none"){
        valor = "ativo"
    }
    const [estadoFotoPerfil , setEstadoFotoPerfil] = useState(valor)
    const condicaoEstadoFotoPerfil = ()=>{
        switch(estadoFotoPerfil){
            case "none":
                return (
                    <p>
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-person-fill" viewBox="0 0 16 16">
                        <path d="M3 14s-1 0-1-1 1-4 6-4 6 3 6 4-1 1-1 1zm5-6a3 3 0 1 0 0-6 3 3 0 0 0 0 6"/>
                        </svg>
                    </p>
                )
            case "ativo":
                const URLIMAGE = `${DadosSombra.foto_vendedor}`
                return (
                    <div className="dados_vendedorIconeIcone">
                        <img src={URLIMAGE} alt="" />
                    </div>
                )
        }
    }
    const urlImage = DadosSombra.url_imagem_produto 
        ? `${DadosSombra.url_imagem_produto}` 
        : ImageDefault


    // ===================== LÓGICA PARA CRIAR SALA + ENVIAR PRODUTO =====================
    const handleSendProductToChat = () => {
        if (!DadosSombra || !socket || !dadosUsuario) {
            alert("Erro: Dados insuficientes.");
            return;
        }

        const idDono = DadosSombra.id_usuario || DadosSombra.id_usuario;

        if (!idDono) {
            alert("Erro: ID do dono do produto não encontrado.");
            return;
        }

        // Criar sala única (formato consistente)
        const ids = [parseInt(dadosUsuario.id), parseInt(idDono)].sort((a, b) => a - b);
        const novaSala = `sala_${ids[0]}_${ids[1]}`;

        // Primeiro: Registar a sala no banco de dados
        socket.emit("aceitar_pedido_amizade", {
            "ID_destinatario": idDono,
            "ID_remitente": dadosUsuario.id,
            "nome_remitente": dadosUsuario.nome
        });

        // ===================== PAYLOAD CONSISTENTE COM O UPLOAD =====================
        const productPayload = {
            isFile: true,
            mimeType: "product/card",
            fileName: DadosSombra.nome_produto || "Produto",
            fileSize: 0,
            fileUrl: urlImage,                    // URL da imagem do produto
            publicId: null,
            folder: "produtos",
            resourceType: "image",
            data: JSON.stringify({
                type: "product_card",
                productId: DadosSombra.id_produto || DadosSombra._id,
                nome: DadosSombra.nome_produto,
                descricao: DadosSombra.descricao_produto,
                preco: DadosSombra.preco_produto,
                tipo: DadosSombra.tipo_produto || "Geral",
                imagem: urlImage,
                url_imagem_produto: DadosSombra.url_imagem_produto
            })
        };

        const mensagemFinal = JSON.stringify(productPayload);

        // Enviar a mensagem
        Enviar_menssagem(
            null,
            socket,
            novaSala,
            idDono,
            DadosSombra.nome_dono || "Vendedor",
            mensagemFinal,
            dadosUsuario
        );

        CloseSombraCard(); 
        // setAtivar("conteiner1")
    };
    // =================================================================================

    const dadosProduto = {
        "nome_produto":DadosSombra.nome_produto,
        "preco_produto": DadosSombra.preco_produto,
        "tipo_produto":DadosSombra.tipo_produto,
        "id_usuario":DadosSombra.id_usuario,
        "Terminal_Conta_Cliente":dadosUsuario.id,
        "urlImage": urlImage
    }

    const E_carteira = ()=>{
        try{
            setEstado("E_carteira")
            setDadosCompraVendedor(dadosProduto)
        }
        catch(err){
            alert(err)
        }
    }

    return (
        <div className="Conteiner2RightWindowProdutsSombraCard">
            <button className="btnCloseCardText" onClick={CloseSombraCard}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
            <div className="ImageCardSombra">
                <img src={urlImage} alt={DadosSombra.nome_produto} />
            </div>
            <div className="textCardSombra">
                <div className="titleCardText">
                    <h3>{DadosSombra.tipo_produto || "Geral"}</h3> 
                </div>
                <h2> {DadosSombra.nome_produto} </h2>
                <li className="comentarioCard">
                     {DadosSombra.descricao_produto}
                </li>
                <div className="textCardSombraBox1">
                    <h3>{DadosSombra.preco_produto}</h3>
                    <div className="boxBox1CardText">
                        <li>★★★★★</li>
                        <b className="avaliacao">4.9</b>
                    </div>
                </div>
                <div className="dados_vendedor">
                        <div className="dados_vendedorIcone">
                            {condicaoEstadoFotoPerfil()}
                        </div>
                        <div className="dados_vendedorCont">
                            <b> {DadosSombra.nome_vendedor} </b>
                            <li>{DadosSombra.quantidade_encomenda_produto} produtos vendidos na ancora</li>
                        </div>
                </div>
                <div className="btnCardText">
                    <button onClick={E_carteira}>Comprar</button>
                    <button onClick={handleSendProductToChat}>Send to chat</button>
                </div>
            </div>
        </div>
    )
}