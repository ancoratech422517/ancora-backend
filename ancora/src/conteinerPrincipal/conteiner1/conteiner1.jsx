import { useState } from "react";
import "./conteiner1.css"
import ConteinerLeft from "./conteinerLeft/conteinerLeft"
import ConteinerRight from "./conteinerRight/conteinerRight";
import ConteinerRightMenuMobile from "./conteinerRightMenuMobile/conteinerRightMenuMobile";
import { useUserStore } from "../../useUseSotore";
export default function Continer1({ativarConteiner}){
    return (
        <div className="conteiner1">
             <ConteinerLeft />
             <ConteinerRight ativarConteiner = {ativarConteiner} />
             <ConteinerRightMenuMobile />
        </div>
    )
}