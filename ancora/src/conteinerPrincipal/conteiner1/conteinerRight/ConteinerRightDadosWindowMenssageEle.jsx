import { useState } from "react";
import "./css/ConteinerRightDadosWindowMensageEle.css"
import { useUserStore } from "../../../useUseSotore";
export default function ConteinerRightDadosWindowMenssageEle ({texto , hora , nome , fundo , foto_amigo}) {
    const iniciais = nome 
    ? nome.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase() 
    : "??";

    let valor = "none"
    if(foto_amigo !== "none"){
        valor = "ativo"
    }
    const [estadoFotoPerfil , setEstadoFotoPerfil] = useState(valor)
    const {urlBancoDeDados} = useUserStore()
    const getUrlVideo = (url) => {
      if (!url) return "";
        // Verifica se a URL já começa com http ou https
        const isUrlCompleta = url.startsWith("http://") || url.startsWith("https://");
        
        return isUrlCompleta ? url : `${urlBancoDeDados}/${url}`;
      };

    const condicaoEstadoFotoPerfil = ()=>{
        switch(estadoFotoPerfil){
            case "none":
                return (
                    <b>{iniciais}</b>
                )
            break
            case "ativo":
                const URLIMAGE = `${getUrlVideo(foto_amigo)}`
                return (
                    <div className="iconeUserEleIcone">
                        <img src={URLIMAGE} alt="" />
                    </div>
                )
            break
        }
    }

    return (
        <div className="ConteinerRightDadosWindowMensageEle">

              <div className="iconeUserEle" style={{background:fundo}}> {condicaoEstadoFotoPerfil()} </div>
              <div className="textoUserEle">
                <li> {texto} </li>
                <span> {hora} </span>
              </div>
              
        </div>
    )
}