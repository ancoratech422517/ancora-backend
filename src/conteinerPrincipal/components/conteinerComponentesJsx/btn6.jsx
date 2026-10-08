import { useState } from "react";
import { ClicarButtom } from "../conteinerComponentsJs/buttonAction";
import "../conteinerComponentesCss/btn6.css"
import Cart from "../conteinerSvg/cart";
export default function Button6 (){
    return (
        <button className="btn3" onClick={ ClicarButtom }>
           <Cart />
        </button>
    )
}