import { useState } from "react";
import "./css/Conteiner7Menu.css"
import Notificacao from "../components/conteinerSvg/notificacao";
import SetaEsquerda from "../components/conteinerSvg/setaEsquerda";
export default function Conteiner7Menu ({setViewChat}) {
    return (
        <div className="Conteiner7Menu">
            <div className="Conteiner7MenuTitle">
                <div className="Conteiner7MenuTitleBox1">
                    <button onClick={()=> setViewChat("chat")}>
                        <SetaEsquerda />
                    </button>
                </div>
                <div className="Conteiner7MenuTitleBox2">
                    <h3>Notificação</h3>
                    <Notificacao />
                </div>
            </div>
            <div className="Conteiner7MenuText">
                <li>Todas</li>
                <li>Novas</li>
                <li>Antigas</li>
            </div>
        </div>
    )
}