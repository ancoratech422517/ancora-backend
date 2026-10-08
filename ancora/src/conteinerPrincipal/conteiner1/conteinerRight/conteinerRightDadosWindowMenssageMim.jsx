import { useState } from "react";
import "./css/ConteinerRightDadosWindowMenssageMim.css"
import { Selecionar_menssagem } from "./js/conteinerRightDadosMenssage";
import { useUserStore } from "../../../useUseSotore";
import { TirarSelecao } from "./js/TirarSelecao";
export default function ConteinerRightDadosWindowMenssageMim ({texto , hora , nome , fundo , id , nossa_sala , id_remitente , foto_usuario}) {
    const {socket , urlBancoDeDados} = useUserStore()
    const {setIdMenssagem} = useUserStore()
    const getUrlVideo = (url) => {
      if (!url) return "";
        // Verifica se a URL já começa com http ou https
        const isUrlCompleta = url.startsWith("http://") || url.startsWith("https://");
        
        return isUrlCompleta ? url : `${urlBancoDeDados}/${url}`;
      };

    let valor = "none"
    if (foto_usuario !== "none"){
        valor = "ativo"
    }
    const [estadoFotoPerfil , setEstadoFotoPerfil] = useState(valor)
    const condicaoEstadoFotoPerfil = ()=>{
        switch(estadoFotoPerfil){
            case "none":
                return (
                    <li> { iniciais } </li>
                )
            case "ativo":
                const URLIMAGE = `${getUrlVideo(foto_usuario)}`
                return (
                    <div className="IconeUserMimIcone">
                        <img src={URLIMAGE} alt="" />
                    </div>
                )
        }
    }
    const iniciais = nome 
        ? nome.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase() 
        : "??";
    return (
        <div className="ConteinerRightDadosWindowMenssageMim" onDoubleClick={(e) => Selecionar_menssagem(e , id , nossa_sala, id_remitente, setIdMenssagem)} onClick={TirarSelecao}>
              
             <div className="textoUserMim">
                <li id={id}>{texto}</li>
                <span className="horaMim"> {hora} </span>
             </div>
             <div className="IconeUserMim" style={{background:fundo}}>
                {condicaoEstadoFotoPerfil()}
             </div>
             
            
        </div>
        
    )
}
