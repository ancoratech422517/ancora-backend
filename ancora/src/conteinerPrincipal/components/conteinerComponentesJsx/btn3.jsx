import { useState } from "react";
import { ClicarButtom } from "../conteinerComponentsJs/buttonAction";
import "../conteinerComponentesCss/btn3.css"
import Store from "../conteinerSvg/store"

export default function Button3 ({ativarConteiner}){
    return (
        <button className="btn3" onClick={(e)=> ClicarButtom (e , ativarConteiner , "conteiner2") }>
            <Store />
        </button>
    )
}
