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
    const condicaoEstadoFotoPerfil = ()=>{
        switch(estadoFotoPerfil){
            case "none":
                return (
                    <b>{iniciais}</b>
                )
            break
            case "ativo":
                const URLIMAGE = `${foto_amigo}`
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