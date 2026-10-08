import { useState } from "react";
import "./css/ConteinerRightMenuMobileScrollDados.css"
import { Enviar_menssagem } from "../../../service/socket_service_enviar_menssagem";
import { useUserStore } from "../../../useUseSotore";
export default function ConteinerRightMenuMobileSCrollDados ({dados}) {
    const {socket , dadosUsuario , ChatAtivo , urlBancoDeDados} = useUserStore()
    const getUrlVideo = (url) => {
      if (!url) return "";
        // Verifica se a URL já começa com http ou https
        const isUrlCompleta = url.startsWith("http://") || url.startsWith("https://");
        
        return isUrlCompleta ? url : `${urlBancoDeDados}/${url}`;
      };

    const urlImage = getUrlVideo(dados.url_imagem_produto)
    
    
    const enviar_menssagem_produto = ()=>{
        // ===================== LÓGICA CONSISTENTE COM O UPLOAD =====================
        const productPayload = {
            isFile: true,
            mimeType: "product/card",
            fileName: dados.nome_produto || "Produto",
            fileSize: 0,
            fileUrl: urlImage,                    // ← URL da imagem (importante)
            publicId: null,
            folder: "produtos",
            resourceType: "image",
            data: JSON.stringify({
                type: "product_card",
                productId: dados.id_produto || dados._id,
                nome: dados.nome_produto,
                descricao: dados.descricao_produto,
                preco: dados.preco_produto,
                tipo: dados.tipo_produto || "Geral",
                imagem: urlImage,
                url_imagem_produto: dados.url_imagem_produto
            })
        };

        const mensagemFinal = JSON.stringify(productPayload);

        // Enviar a mensagem
        Enviar_menssagem(
            null,
            socket,
            ChatAtivo?.nossa_sala,
            ChatAtivo?.id_amigo,
            ChatAtivo?.nome_amigo || "Vendedor",
            mensagemFinal,
            dadosUsuario
        );

    }

    return (
        
        <div className="ConteinerRightMenuMobileScrollDados">
            <div className="ConteinerRightMenuMobileScrollDadosImage">
                <img src={urlImage}  />
            </div>
            <div className="ConteinerRightMenuMobileScrollDadosCont">
                <b>{dados.nome_produto}</b>
                <li>{dados.preco_produto}</li>
                <strong onClick={enviar_menssagem_produto}>send to chat →</strong>
            </div>
        </div>
    )
}