import { useState } from "react";
import { ClicarButtom } from "../conteinerComponentsJs/buttonAction";
import "../conteinerComponentesCss/btn2.css"
import Chat from "../conteinerSvg/chat"
export default function Button2({ativarConteiner}){
    return (
        <button className="btn3" onClick={(e)=> ClicarButtom (e , ativarConteiner , "conteiner1") } >
           <Chat />
        </button>
    )
}