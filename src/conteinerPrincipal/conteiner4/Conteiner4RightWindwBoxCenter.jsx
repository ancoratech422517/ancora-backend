import { useState } from "react";
import "./css/Conteiner4RightWindowBoxCenter.css"
import Cart from "../components/conteinerSvg/cart";
import Vendido from "../components/conteinerSvg/vendido";
import Quantidade from "../components/conteinerSvg/quantidade";
export default function Conteiner4RightWindowBoxCenter () {
    return (
        <div className="Conteiner4RightWindowBoxCenter">
            <div className="Conteiner4RightWindowBoxCenterBoxGrafico">
                {/* INICIO DOS DADOS DO GRAFICO DA CAXA */}
                <div className="Conteiner4RightWindowBoxCenterGraficoCaxa">
                    <div className="Conteiner4RightWindowBoxCenterGraficoCaxaIcone">
                        <Cart />
                    </div>
                    <h3> Loja: Produtos</h3>
                </div>
                <div className="Conteiner4RightWindowBoxCenterGraficoCaxa">
                    <b>Compras realizadas:</b>
                    <p>Total: 37%</p>
                </div>
                <div className="Conteiner4RightWindowBoxCenterGraficoCaxa">
                    <b>Stock actual:</b><p>Total: 63%</p>
                </div>
                {/* FIM DOS DADOS DO GRAFICO DA CAXA */}
            </div>
            <div className="Conteiner4RightWindowBoxCenterBoxGrafico">
                {/* INICIO DOS DADOS DO GRAFICO DA CAXA */}
                <div className="Conteiner4RightWindowBoxCenterGraficoCaxa">
                    <div className="Conteiner4RightWindowBoxCenterGraficoCaxaIcone">
                        <Vendido />
                    </div>
                    <h3> Mais: Vendido</h3>
                </div>
                <div className="Conteiner4RightWindowBoxCenterGraficoCaxa">
                    <b>Taxa do produto:</b>
                    <p>Total: 15%</p>
                </div>
                <div className="Conteiner4RightWindowBoxCenterGraficoCaxa">
                    <b>Stock actual:</b><p>Total: 10%</p>
                </div>
                {/* FIM DOS DADOS DO GRAFICO DA CAXA */}

            </div>
            <div className="Conteiner4RightWindowBoxCenterBoxGrafico">
                {/* INICIO DOS DADOS DO GRAFICO DA CAXA */}
                <div className="Conteiner4RightWindowBoxCenterGraficoCaxa">
                    <div className="Conteiner4RightWindowBoxCenterGraficoCaxaIcone">
                        <Cart />
                    </div>
                    <h3> @Meus: Clientes</h3>
                </div>
                <div className="Conteiner4RightWindowBoxCenterGraficoCaxa">
                    <b>Quantidade:</b>
                    <p>Total: 37.C</p>
                </div>
                <div className="Conteiner4RightWindowBoxCenterGraficoCaxa">
                    <b>Estimativa:</b><p>Total: 200.C</p>
                </div>
                {/* FIM DOS DADOS DO GRAFICO DA CAXA */}

            </div>
            <div className="Conteiner4RightWindowBoxCenterBoxGrafico">
                {/* INICIO DOS DADOS DO GRAFICO DA CAXA */}
                <div className="Conteiner4RightWindowBoxCenterGraficoCaxa">
                    <div className="Conteiner4RightWindowBoxCenterGraficoCaxaIcone">
                        <Cart />
                    </div>
                    <h3> @Loja: Lucro</h3>
                </div>
                <div className="Conteiner4RightWindowBoxCenterGraficoCaxa">
                    <b>Ganhos:</b>
                    <p>Total: 237.000.00</p>
                </div>
                <div className="Conteiner4RightWindowBoxCenterGraficoCaxa">
                    <b>Estimativa.M:</b><p>Total: O suficiente</p>
                </div>
                {/* FIM DOS DADOS DO GRAFICO DA CAXA */}

            </div>
        </div>
    )
}