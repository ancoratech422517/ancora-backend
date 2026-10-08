import { useState } from "react";
import { ClicarButtom } from "../conteinerComponentsJs/buttonAction";
import "../conteinerComponentesCss/btn2.css"
import Feeds from "../conteinerSvg/feeds";
export default function Button9({ativarConteiner}){
    return (
        <button className="btn3" onClick={(e)=> ClicarButtom (e , ativarConteiner , "conteiner8") } >
           <Feeds />
        </button>
    )
}