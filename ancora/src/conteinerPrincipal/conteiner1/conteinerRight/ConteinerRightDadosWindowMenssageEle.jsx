import { useState } from "react";
import "./css/ConteinerRightDadosWindowMensageEle.css"
import { useUserStore } from "../../../useUseSotore";
import Perfil from "../../../assets/img_fundo_vazio/perfil.png"
export default function ConteinerRightDadosWindowMenssageEle ({texto , hora , nome , fundo , foto_amigo}) {
    const iniciais = nome 
    ? nome.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase() 
    : "??";

    let valor = "none"
    if(foto_amigo !== "none"){
        valor = "ativo"
    }
    const [estadoFotoPerfil , setEstadoFotoPerfil] = useState(valor)
    const {urlBancoDeDados , Tipo_Chat_Turma} = useUserStore()

    const condicao_mostrar_nome_amigo_turma = ()=>{
        switch(Tipo_Chat_Turma){
            case true:
                return(
                    <b>{nome}</b>
                )
        }
    }

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
                    <div className="iconeUserEleIcone IconePerfilElePadrao">
                        <img src={Perfil} alt="" />
                    </div>
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
        <div className="conteiner_block_mensage_chat">
            <div className="ConteinerRightDadosWindowMensageEle">
                
                <div className="iconeUserEle"> {condicaoEstadoFotoPerfil()} </div>
                <div className="textoUserEle">
                    {condicao_mostrar_nome_amigo_turma()}
                    <li> {texto} </li>
                </div>
            </div>
            <span> {hora} </span>
        </div>

    )
}