import { useState } from "react";
import "./css/ConteinerRightDadosWindowMensageEle.css"
import { useUserStore } from "../../../useUseSotore";
import Perfil from "../../../assets/img_fundo_vazio/perfil.png"
import { Selecionar_menssagem } from "./js/conteinerRightDadosMenssage";
import { TirarSelecao } from "./js/TirarSelecao";
export default function ConteinerRightDadosWindowMenssageEle ({texto , hora , nome , fundo , id , nossa_sala , id_remitente, foto_amigo, mensagemOriginal, nomeOriginal}) {
    const iniciais = nome 
    ? nome.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase() 
    : "??";

    let valor = "none"
    if(foto_amigo !== "none"){
        valor = "ativo"
    }
    const [estadoFotoPerfil , setEstadoFotoPerfil] = useState(valor)
    const {urlBancoDeDados , Tipo_Chat_Turma , setIdMenssagem} = useUserStore()

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
        <div className="conteiner_block_mensage_chat" >
            <div className="ConteinerRightDadosWindowMensageEle" onDoubleClick={(e) => Selecionar_menssagem(e , id , nossa_sala, id_remitente, setIdMenssagem)} onClick={TirarSelecao}>
                
                <div className="iconeUserEle"> {condicaoEstadoFotoPerfil()} </div>
                <div className="textoUserEle">
                    {condicao_mostrar_nome_amigo_turma()}
                    {mensagemOriginal && (
                        <div className="responder_menssagem_usuarioEle">
                            <h3>Eu</h3>
                            <em>{mensagemOriginal}</em>
                        </div>
                    )}
                    <li> {texto} </li>
                </div>
            </div>
            <span> {hora} </span>
        </div>

    )
}