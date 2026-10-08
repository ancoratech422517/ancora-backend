import { useState } from "react";
import { ClicarButtom } from "../conteinerComponentsJs/buttonAction";
import "../conteinerComponentesCss/btn4.css"
import Orders from "../conteinerSvg/orders";

export default function Button4 ({ativarConteiner}){
    return (
        <button className="btn3" onClick={(e)=> ClicarButtom (e , ativarConteiner , "conteiner3") }>
           <Orders />
        </button>
    )
}