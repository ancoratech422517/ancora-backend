import { useState } from "react";
import "./css/Conteiner.css"
import Conteiner4WindowGrafico from "./Conteiner4WindowGrafico";
import MenuConteinerLeft from "../conteiner1/conteinerLeft/menuConteinerLeft";
import Conteiner4RightWindow from "./Conteiner4RighrWindow";

export default function Conteiner4 () {
    return (
        <div className="Conteiner">
               <Conteiner4RightWindow />
        </div>
    )
}