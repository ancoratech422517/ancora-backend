import { useState } from "react";   
import "./css/Conteiner5WindowConteinerTrafego.css"
import { useUserStore } from "../../useUseSotore";
export default function Conteiner5WindowConteinerTrafego () {
    const {setMostrarProdutoTrafego , MostrarProdutoTrafego} = useUserStore()
    return (
        <div className="Conteiner5WindowConteinerTrafego">
            <div className="Conteiner5WindowConteinerTrafegoEstaus">
                <span>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-bar-chart-line" viewBox="0 0 16 16">
                    <path d="M11 2a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v12h.5a.5.5 0 0 1 0 1H.5a.5.5 0 0 1 0-1H1v-3a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v3h1V7a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v7h1zm1 12h2V2h-2zm-3 0V7H7v7zm-5 0v-3H2v3z"/>
                    </svg>
                </span>
                <h3>Dados de Trafego</h3>
                <li>Visualize o tráfego de visitas e conversões do seu perfil.</li>
                <button className="Conteiner5WindowConteinerTrafegoEstausBtn">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-clipboard2-data-fill" viewBox="0 0 16 16">
                    <path d="M10 .5a.5.5 0 0 0-.5-.5h-3a.5.5 0 0 0-.5.5.5.5 0 0 1-.5.5.5.5 0 0 0-.5.5V2a.5.5 0 0 0 .5.5h5A.5.5 0 0 0 11 2v-.5a.5.5 0 0 0-.5-.5.5.5 0 0 1-.5-.5"/>
                    <path d="M4.085 1H3.5A1.5 1.5 0 0 0 2 2.5v12A1.5 1.5 0 0 0 3.5 16h9a1.5 1.5 0 0 0 1.5-1.5v-12A1.5 1.5 0 0 0 12.5 1h-.585q.084.236.085.5V2a1.5 1.5 0 0 1-1.5 1.5h-5A1.5 1.5 0 0 1 4 2v-.5q.001-.264.085-.5M10 7a1 1 0 1 1 2 0v5a1 1 0 1 1-2 0zm-6 4a1 1 0 1 1 2 0v1a1 1 0 1 1-2 0zm4-3a1 1 0 0 1 1 1v3a1 1 0 1 1-2 0V9a1 1 0 0 1 1-1"/>
                    </svg>
                    <b onClick={()=> MostrarProdutoTrafego == "false" ? setMostrarProdutoTrafego("True"):setMostrarProdutoTrafego("false")}>Publicitar Produto</b>
                </button>
            </div>

            <div className="Conteiner5WindowConteinerTrafegoBoxScroll">
                <div className="Conteiner5windowConteinerTrafegoBoxScrollMenuTop">
                    <li>📦 Produto</li>
                    <li>❣️ Curtida</li>
                    <li>💰 Encomenda</li>
                    <li>👀 Visto</li>
                </div>
                <div className="Conteiner5WindowConteinerTrafegoBoxScrollConteiner">
                    <div className="Conteiner5WindowConteinerTrafegoBoxScrollConteinerDados">
                        <li>📦 Iphone</li>
                        <li>❣️ 45 </li>
                        <li>💰 53</li>
                        <li>👀 128 </li>
                    </div>
                    
                </div>
            </div>

        </div>
    )
}