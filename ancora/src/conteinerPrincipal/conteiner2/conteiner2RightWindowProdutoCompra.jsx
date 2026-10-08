import { useState } from "react";
import "./css/Conteiner2RightWindowProdutoCompra.css"
import Multicaixa from "../../assets/multicaixa2.png"
import AncoraPay from "../../assets/ancorapay2.png"
import { useUserStore } from "../../useUseSotore";
import { ConteinerComprarProduto } from "./js/ConteinerEnviarDijnheiro";
import Logo from "../../assets/logo2.png"
import Loading3 from "../components/conteinerComponentesJsx/loading3";
import { CloseSombraCard } from "./js/Conteiner2SomraCard";

export default function Conteiner2RightWindowProddutoCompra ({setEstado}) {
    const [estadoEscolha , setEstadoEscolha] = useState("escolha")
    const {DadosCompraVendedor , dadosUsuario , socket, buscar_notificacao , setEstadoNotificacao , EstadoNotificacao , urlBancoDeDados} = useUserStore()
    const [load , setLoad] = useState("none")
    const [Escolha_load , setEscolha_load] = useState("loading")
    const [Resposta , setResposta] = useState("")
    const getUrlVideo = (url) => {
      if (!url) return "";
        // Verifica se a URL já começa com http ou https
        const isUrlCompleta = url.startsWith("http://") || url.startsWith("https://");
        
        return isUrlCompleta ? url : `${urlBancoDeDados}/${url}`;
      };
 
    if(EstadoNotificacao !== "False"){
        buscar_notificacao(dadosUsuario?.id)
    }

    const [estadoNotifi , setEstadoNoti] = useState("none")
    if (estadoNotifi === "ativo"){
        buscar_notificacao(dadosUsuario.id)
    }

    const escolhaLoading = ()=>{
        switch(Escolha_load){
            case "loading":
                return (
                    <Loading3 />
                )
            case "resposta":
                return (
                    <li className="resposta_pagamento">
                        {Resposta}
                    </li>
                )
        }
    }
    const loading = ()=>{
        switch(load){
            case "true":
                return (
                    <div className="Conteiner2RightWindowProdutoCompraLoading">
                        <div className="Conteiner2RightWindowProdutoCompraLoadingBoxTop">
                            {escolhaLoading()}
                        </div>
                    </div>
                )
        }
    }
    const reacao = ()=>{
        switch(estadoEscolha){
            case "escolha":
                return (
                    <div className="Conteiner2RightWindowProdutoCompraEscolha">
                        <button className="btnCloseCardText" onClick={()=> CloseSombraCard("" , "" , setEstado)}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                        </button>
                        {/* <div className="Conteiner2RightWindowProdutoCompraEscolhaTirar">
                            cancelar
                        </div> */}
                        <div className="Conteiner2RightWindowProdutoCompraEscolhaImageTop">
                            <img src={Logo} alt="" />
                        </div>
                        <h3>Ancora Ecommerce</h3>
                        <p>escolha o a sua carteira digital para efetuar o pagamanto</p>
                        <div className="conteiner2RightWindowProdutoCompraEscolhaProduto">
                            <div className="conteiner2RightWindowProdutoCompraEscolhaProdutoImage">
                                <img src={getUrlVideo(DadosCompraVendedor.urlImage)} alt="" />
                            </div>
                            <div className="conteiner2RightWindowProdutoCompraEscolhaProdutoCont">
                                <b> {DadosCompraVendedor.nome_produto} </b>
                                <h2> {DadosCompraVendedor.preco_produto} </h2>
                                <li>Finalize a sua compra dentro da Ancora</li>
                            </div>
                        </div>
                        <div className="Conteiner2RightWindowProdutoCompraBox">
                            <div className="Conteiner2RightWindowProdutoCompraBoxIcone">
                                <img src={Multicaixa} alt="" />
                            </div>
                            <button className="Multicaixa" onClick={()=> setEstadoEscolha("escolhido")}>Multicaixa Express</button>
                        </div>
                        <div className="Conteiner2RightWindowProdutoCompraBox">
                            <div className="Conteiner2RightWindowProdutoCompraBoxIcone">
                                <img src={AncoraPay} alt="" />
                            </div>
                            <button className="ancoraPay">AncoraPay</button>
                        </div>
                    </div>
                )
            ;
            case "escolhido":
                return (
                    <div className="Conteiner2RightWindowProdutoCarteiraEscolhida">
                        <li className="btnCloseCardText" onClick={()=> CloseSombraCard("" , "" , setEstado)}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                        </li>
                        <div className="DadosProdutosCompraCarteira">
                            <div className="DadosProdutosCompraCarteiraIcone">
                                <img src={getUrlVideo(DadosCompraVendedor.urlImage)} alt="" />
                            </div>
                            <div className="DadosProdutosCompraCarteiraCont">
                                <li>Produto - <b>{DadosCompraVendedor.nome_produto}</b> </li>
                                <li>Preço - <b>{DadosCompraVendedor.preco_produto}</b> </li>
                            </div>
                        </div>
                        <div className="iconeCarteira">
                            <img src={Multicaixa} alt="" />
                        </div>
                        <h3><b>Carteira</b> - Multicaixa Express</h3>
                        <label htmlFor="texto">Digite o terminal da sua conta</label>
                        <input type="tel" placeholder="+244 xxx xxx xxx" id="terminal_multicaixa"/>
                        <button onClick={()=>ConteinerComprarProduto(DadosCompraVendedor , dadosUsuario , setLoad , setEscolha_load , setResposta , socket , setEstadoNoti , setEstadoNotificacao)}>Confirmar Pagamento</button>
                        
                    </div>

                )
        }
    }
    return ( 
        <div className="Conteiner2RightWindowProdutoCompra">
            {reacao()}
            {loading()}
        </div>
    )
}