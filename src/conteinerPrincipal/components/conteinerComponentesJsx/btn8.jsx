import { useState } from "react";
import Notificacao from "../conteinerSvg/notificacao";
import { ClicarButtom } from "../conteinerComponentsJs/buttonAction";
import "../conteinerComponentesCss/btn3.css"

export default function Button8 ({setViewChat}) {
    return (
                <button onClick={()=> setViewChat("conteiner7")} >
                   <Notificacao />
                   
                </button>
    )
}