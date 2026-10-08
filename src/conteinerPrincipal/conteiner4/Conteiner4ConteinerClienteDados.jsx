import { useState } from "react";
import "./css/Conteiner4ConteinerClienreDados.css"
import ChatSvg from "../components/conteinerSvg/chat";
export default function Conteiner4ConteinerClienteDados () {
    return (
        <div className="Conteiner4ConteinerClienreDados">
            <div className="Conteiner4ConteinerClienreDadosIcone"></div>
            <div className="Conteiner4ConteinerClienreDadosText">
                <b>Cláudio Avelino</b>
                <li>Cliente dos aparelho eletronico</li>
            </div>
            <div className="Conteiner4ConteinerClienreDadosBtn">
                <button>
                    <b>Conversar</b>
                    <ChatSvg />
                </button>
            </div>
        </div>
    )
}