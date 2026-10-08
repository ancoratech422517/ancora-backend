import { useState } from "react";
import "./css/conteiner5.css"
import MenuConteinerLeft from "../conteiner1/conteinerLeft/menuConteinerLeft";
import Conteiner5Window from "./conteiner5Window";
import Mais from "../components/conteinerSvg/mais";
import { useUserStore } from "../../useUseSotore";
export default function Conteiner5 () {

    return (
        <div className="Conteiner5">
            <Conteiner5Window />
        </div>
    )
}
