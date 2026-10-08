import { useState } from "react";
import "./css/Conteiner2SearchPrduto.css"
export default function Conteiner2SearchProduto () {
    return (
        <div className="Conteiner2SearchPrduto">
            <input type="text" placeholder="Pesquisar Produto..." id="pesquisar_produto" />
            <button>buscar</button>
        </div>
    )
}