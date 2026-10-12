import { useState } from "react";   
import "./css/Conteiner3.css"
import MenuConteinerLeft from "../conteiner1/conteinerLeft/menuConteinerLeft";
import ConteinerMenuLeftCRM from "./ConteinerMenuLeftCRM";
import ConteinerMenuRightCRM from "./ConteinerMenuRightCRM";
export default function Conteiner3 () {
    return (
        <div className="Conteiner3">
            <ConteinerMenuLeftCRM />
            <ConteinerMenuRightCRM />
        </div>
    )
}
