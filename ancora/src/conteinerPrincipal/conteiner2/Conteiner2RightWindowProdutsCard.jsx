import React, { useState, useEffect } from "react"; // Adicionei useEffect aqui
import "./css/Conteiner2RightWindowProdutsCard.css";
import { CloseSombraCard } from "./js/Conteiner2SomraCard";
import { useUserStore } from "../../useUseSotore";
import { Sistema_de_adoro_dinamico } from "./js/ConteinerSistemaAdoro";
// Importamos uma imagem padrão caso o produto não tenha foto
import ImageDefault from "../../assets/image_card.png";

export default function Conteiner2RightWindowProdutsCard({ dados }) {
    // Adicionei TodosProdutos aqui para monitorar a Store global
    const {setDadosSombra , urlBancoDeDados , dadosUsuario, TodosProdutos} = useUserStore()
    
    if (!dados) return <div className="Conteiner2RightWindowProdutsCard">Carregando...</div>;

    const [estado_reacao_adoro_classe , setEstado_reacao_adoro_classe] = useState(dados.estado_adoro)
    const [valor_quantidade_adoro , setValor_quantidade_adoro] = useState(dados.quantidade_adoro_produto)

    // --- MINHA LÓGICA ADICIONADA: SINCRONIZAÇÃO COM O ZUSTAND ---
    useEffect(() => {
        // Busca a versão atualizada deste produto na Store global
        const produtoGlobal = TodosProdutos?.find(p => p.id === dados.id);
        if (produtoGlobal) {
            
            setValor_quantidade_adoro(produtoGlobal.quantidade_adoro_produto);
        }
    }, [TodosProdutos, dados.id]); 
    // -----------------------------------------------------------

    const condicao_estado_reacao_classe = ()=>{
        switch(estado_reacao_adoro_classe){
            case "False":
                return ("fundo_branco")
            case "True":
                return ("fundo_teal")
            default:
                return ("fundo_branco")
        }
    }

    const novo_valor_adoro = ()=>{
        return (valor_quantidade_adoro)
    }
    const getUrlVideo = (url) => {
      if (!url) return "";
        // Verifica se a URL já começa com http ou https
        const isUrlCompleta = url.startsWith("http://") || url.startsWith("https://");
        
        return isUrlCompleta ? url : `${urlBancoDeDados}/${url}`;
      };


    let urlImagem = getUrlVideo(dados.url_imagem_produto)
    
        ? `${dados.url_imagem_produto}` 
        : ImageDefault;

    let valor = "none"
    if(dados.foto_vendedor !== "none"){
        valor = "ativar"
    }
    const [estadoFotoUser , setEstadoFotoUser] = useState(valor)
    const condicaoEstadoFotoUser = ()=>{
        switch(estadoFotoUser){
            case "none":
                return (
                    <b>A</b>
                )
            case "ativar":
                const URLIMAGE = `${getUrlVideo(dados.foto_vendedor)}`
                
                return (
                    <div className="menu_reacao_produtoBoxRightIcone">
                        <img src={URLIMAGE} alt="" />
                    </div>
                )
        }
    }

    return (
        <div className="Conteiner2RightWindowProdutsCard">
            <div className="menu_reacao_produto">
                <div className="menu_reacao_produtoBoxRight">
                    {condicaoEstadoFotoUser()}
                </div>
                <div className={`menu_reacao_produtoBoxLeft ${dados.estado_adoro === "True" ? "fundo_teal" : ""} ${condicao_estado_reacao_classe()}`}>
                    <span>
                        <b> {novo_valor_adoro()} </b>
                        <svg  onClick={()=>{Sistema_de_adoro_dinamico(dados.id , setEstado_reacao_adoro_classe , estado_reacao_adoro_classe , setValor_quantidade_adoro , valor_quantidade_adoro )}} xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-heart-fill" viewBox="0 0 16 16">
                            <path fillRule="evenodd" d="M8 1.314C12.438-3.248 23.534 4.735 8 15-7.534 4.736 3.562-3.248 8 1.314"/>
                        </svg>
                    </span>
                    <span>
                        <b> {dados.visualizacao_produto} </b>
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-eye-fill" viewBox="0 0 16 16">
                        <path d="M10.5 8a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0"/>
                        <path d="M0 8s3-5.5 8-5.5S16 8 16 8s-3 5.5-8 5.5S0 8 0 8m8 3.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7"/>
                        </svg>
                    </span>
                </div>
            </div>
            <div className="ImageCard">
                <img src={urlImagem} alt={dados.nome_produto} />
            </div>
            <div className="dadosCard">
                <li>{dados.tipo_produto || "Geral"}</li>
                
                <b>{dados.nome_produto}</b>
                
                <div className="boxCardButtom">
                    <div className="dadosBoxCard1">
                        <h4>{dados.preco_produto}</h4>
                        <s>{dados.preco_antigo || "---"} KZ</s>
                    </div>
                    
                    <li onClick={() => CloseSombraCard(dados , setDadosSombra)} style={{ cursor: 'pointer' }}>
                        +
                    </li>
                </div>
            </div>
        </div>
    );
}