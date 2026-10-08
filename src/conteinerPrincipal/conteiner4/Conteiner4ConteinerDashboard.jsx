import { useState } from "react";
import "./css/Conteiner3ConteinerDashboard.css"

import Conteiner4RightWindowBoxCenter from "./Conteiner4RightWindwBoxCenter";
import Conteiner4WindowGrafico from "./Conteiner4WindowGrafico";
export default function Conteiner4ConteinerDashboard () {
    return (
        <div className="Conteiner3ConteinerDashboard">
            <Conteiner4RightWindowBoxCenter />
            <Conteiner4WindowGrafico />
        </div>
    )
}