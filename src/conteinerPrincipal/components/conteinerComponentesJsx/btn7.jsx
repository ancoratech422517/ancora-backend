import { useState } from "react";
import Grafico from "../conteinerSvg/grafico";
import { ClicarButtom } from "../conteinerComponentsJs/buttonAction";
import "../conteinerComponentesCss/btn3.css"

export default function Button7 ({ativarConteiner}) {
    return (
                <button className="btn3" onClick={(e)=> ClicarButtom (e , ativarConteiner , "conteiner4") }>
                   <Grafico />
                </button>
    )
}