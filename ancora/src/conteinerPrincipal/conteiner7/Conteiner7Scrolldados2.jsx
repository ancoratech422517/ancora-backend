import { useState } from "react";
import "./css/ConteinerScrollDados2.css"
import { Conteiner2ScrollDadosDeletarSms } from "./js/Conteiner2ScrolldadosDeletarSms";
import { Conteiner2ScrollDadosDetalhesProduto } from "./js/Conteiner2ScrollDadosDetalhesProduto";
import { useUserStore } from "../../useUseSotore";
export default function ConteinerScrollDados2 ({dados}) {
    const {dadosUsuario , buscar_notificacao , setDetalhesProduto , setAtivarDetalhes , urlBancoDeDados} = useUserStore()
    const [estado , setEstado] = useState("none")
    const getUrlVideo = (url) => {
        if (!url) return "";
            // Verifica se a URL já começa com http ou https
            const isUrlCompleta = url.startsWith("http://") || url.startsWith("https://");
            
            return isUrlCompleta ? url : `${urlBancoDeDados}/${url}`;
        };

    if (estado === "buscar"){
        buscar_notificacao(dadosUsuario.id)
    }
    let valor = "none"
    if(dados.imagem_produto){
        valor = "ativo"
    }
    const [estdoImageProduto , setEstadoImageProduto] = useState(valor)
    const condicaoEstadoImageProduto = ()=>{
        switch(estdoImageProduto){
            case "none":
                return (
                    <b> A </b>
                )
            case "ativo":
                const URLIMAGE = getUrlVideo(dados.imagem_produto)
           
                return (
                    <div className="ConteinerScrollDados2IconeIcone">
                        <img src={URLIMAGE} alt="" />
                    </div>
                )
        }
    }
    return (
        <div className="ConteinerScrollDados2">
            <div className="ConteinerScrollDados2Icone">
                <div className="CoteinerScrollDados2IconeIcone">
                    {condicaoEstadoImageProduto()}
                </div>
            </div>
            <div className="ConteinerScrollDados2Cont">
                <b> {dados.mensagem} - {dados.data}</b>
                <div className="ConteinerScroll2ContBox">
                    <h4>valor:{dados.preco_produto}</h4>
                    <li>pendente</li>
                </div>
                <div className="ConteinerScrollDados2ContBtn">
                    <button onClick={()=> Conteiner2ScrollDadosDeletarSms(dados.id , dadosUsuario.id , dados.tipo_notificacao , setEstado)}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-trash-fill" viewBox="0 0 16 16">
                        <path d="M2.5 1a1 1 0 0 0-1 1v1a1 1 0 0 0 1 1H3v9a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V4h.5a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1H10a1 1 0 0 0-1-1H7a1 1 0 0 0-1 1zm3 4a.5.5 0 0 1 .5.5v7a.5.5 0 0 1-1 0v-7a.5.5 0 0 1 .5-.5M8 5a.5.5 0 0 1 .5.5v7a.5.5 0 0 1-1 0v-7A.5.5 0 0 1 8 5m3 .5v7a.5.5 0 0 1-1 0v-7a.5.5 0 0 1 1 0"/>
                        </svg>
                        Deletar
                    </button>
                    <button onClick={()=> {Conteiner2ScrollDadosDetalhesProduto(dados , setDetalhesProduto , setAtivarDetalhes)}}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-stack" viewBox="0 0 16 16">
                        <path d="m14.12 10.163 1.715.858c.22.11.22.424 0 .534L8.267 15.34a.6.6 0 0 1-.534 0L.165 11.555a.299.299 0 0 1 0-.534l1.716-.858 5.317 2.659c.505.252 1.1.252 1.604 0l5.317-2.66zM7.733.063a.6.6 0 0 1 .534 0l7.568 3.784a.3.3 0 0 1 0 .535L8.267 8.165a.6.6 0 0 1-.534 0L.165 4.382a.299.299 0 0 1 0-.535z"/>
                        <path d="m14.12 6.576 1.715.858c.22.11.22.424 0 .534l-7.568 3.784a.6.6 0 0 1-.534 0L.165 7.968a.299.299 0 0 1 0-.534l1.716-.858 5.317 2.659c.505.252 1.1.252 1.604 0z"/>
                        </svg>
                        Detalhes
                    </button>
                </div>
            </div>
        </div>
    )
}