import React, { useRef, useEffect, useState } from "react";
import "./css/Conteiner4WindowGrafico.css"
import {Chart as Chartjs} from "chart.js/auto"
import {Bar , Doughnut , Line , Radar , PolarArea , Scatter} from "react-chartjs-2"
import DadosGraficoJson from "./data/DataGrafico.json"
// Importe os dados do seu arquivo JS
// Crie uma constante para as cores para não repetir código
const paletaHarmoniosa = [
    "rgba(0, 206, 209, 0.8)",   // DarkTurquoise (Principal)
    "rgba(46, 204, 113, 0.8)",  // Emerald Green (Crescimento)
    "rgba(52, 152, 219, 0.8)",  // Peter River Blue (Confiança)
    "rgba(26, 188, 156, 0.8)",  // Turquoise (Variação)
    "rgba(127, 140, 141, 0.6)"   // Asbestos (Neutro para equilíbrio)
];

// No seu componente:
export default function Conteiner4WindowGrafico () {
    return (
        <div className="Conteiner4WindowGrafico">
            <div className="grafico">
                <Bar
                    data={{
                        labels: DadosGraficoJson.map((data) => data.labe ),
                        datasets:[
                            {
                                label: "Receita (Kz)",
                                data: DadosGraficoJson.map((data)=> data.value),
                                backgroundColor: paletaHarmoniosa, // Usando a nova paleta
                                borderColor: "rgba(255, 255, 255, 0.1)", // Borda sutil
                                borderWidth: 1,
                                borderRadius: 8 // Aumentei um pouco o arredondamento
                            }
                        ]
                    }}
                    options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: {
                                labels: { color: '#666' } // Cor do texto da legenda
                            }
                        }
                    }}
                />
            </div>
            
            <div className="grafico">
                <Doughnut 
                    className="object"
                    data={{
                        labels: DadosGraficoJson.map((data) => data.labe ),
                        datasets:[
                            {
                                label: "Revenue",
                                data: DadosGraficoJson.map((data)=> data.value),
                                backgroundColor: paletaHarmoniosa, // Mesma paleta para harmonia
                                hoverOffset: 15,
                                borderColor: "#fff", // Separação branca no Doughnut fica elegante
                                borderWidth: 2
                            }
                        ]
                    }}
                    options={{
                        responsive: true,
                        maintainAspectRatio: false
                    }}
                />
            </div>
        </div>
    )
}