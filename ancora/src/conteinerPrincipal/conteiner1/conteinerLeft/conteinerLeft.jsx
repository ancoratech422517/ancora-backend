import { useState } from "react";
import "./css/conteinerLeft.css"
import MenuConteinerLeft from "./menuConteinerLeft"
import GeralConteinerPrincialLeft from "./geralConteinerLeft/geralChat/geralConteinerPrincipalLeft";
export default function ConteinerLeft({}){
    return (
        <div className="conteinerLeft">
            <GeralConteinerPrincialLeft />
        </div>
    )
}