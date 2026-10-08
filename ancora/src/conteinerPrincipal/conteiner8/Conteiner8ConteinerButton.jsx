import { useState } from "react";
import "./css/Conteiner8ConteinerButton.css"
import Conteiner8ConteinerButtonBoxLeft from "./Conteiner8ConteinerButtonBoxLeft";
import Conteiner8ConteinerButtonBoxRight from "./Conteiner8ConteinerButtonBoxRight";
export default function Conteiner8ConteinerButton () {
    return (
        <div className="Conteiner8ConteinerButton">
            <Conteiner8ConteinerButtonBoxLeft />
            <Conteiner8ConteinerButtonBoxRight />
        </div>
    )
}