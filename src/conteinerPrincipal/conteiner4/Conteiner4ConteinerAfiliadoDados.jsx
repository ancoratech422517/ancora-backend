import { useState } from "react";
import "./css/Conteiner4ConteinerAfiliadosDados.css"
export default function Conteiner4ConteinerAfiliadoDados () {
    return (
        <div className="Conteiner4ConteinerAfiliadosDados">
            <div className="Conteiner4ConteinerAfiliadoDadosIcone"></div>
            <div className="Conteiner4ConteinerAfiliadoDadosText">
                <b>Cláudio Avelino</b>
                <li>Afiliados Ativo-Produto</li>
            </div>
            <div className="Conteiner4ConteinerAfiliadoDadosBtn">
                <button>Dados</button>
                <button>Conversa</button>
            </div>
        </div>
    )
}