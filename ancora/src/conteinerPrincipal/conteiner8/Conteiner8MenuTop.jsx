import { useState } from "react";
import "./css/Conteiner8MenuTop.css"
export default function Conteiner8MenuTop () {
    return (
        <div className="Conteiner8MenuTop">
            <div className="Conteiner8MenuTopBox1">
                <h2>Ancora</h2>
                <li>Desfrute do seu feed social</li>
            </div>
            <div className="Conteiner8MenuTopBox2">
                <li>Para Ti</li>
                <li>Seguindo</li>
                <li>Populares</li>
                <input type="text" placeholder="pesquisar publicações"  />
                <button>pesquisar</button>
            </div>
        </div>
    )
}