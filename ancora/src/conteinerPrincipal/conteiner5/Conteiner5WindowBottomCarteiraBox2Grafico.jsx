import { useState } from "react";
import React from "react";
import {Chart as ChartJs} from "chart.js/auto"
import {Bar} from "react-chartjs-2"
import dataGraficoBarSaque from "./data/dataGraficoBarSaque.json"
const paletaHarmoniosa = [
    "rgba(0, 206, 209, 0.8)",   // DarkTurquoise (Principal)
    "rgba(46, 204, 113, 0.8)",  // Emerald Green (Crescimento)
    "rgba(52, 152, 219, 0.8)",  // Peter River Blue (Confiança)
    "rgba(26, 188, 156, 0.8)",  // Turquoise (Variação)
    "rgba(127, 140, 141, 0.6)"   // Asbestos (Neutro para equilíbrio)
];
export default function Conteiner5WindowBottomCarteiraBox2GraficoBar () {
    return (
        <Bar 
            data={{
                labels: dataGraficoBarSaque.map((data)=>data.label),
                datasets:[
                    {
                        label:"Quantidade de saque mensal",
                        data: dataGraficoBarSaque.map((data)=>data.value),
                        backgroundColor: paletaHarmoniosa ,
                        borderRadius: 5,
                        
                    }
                ]
                
            }}
            
            options={{
                responsive: true,
                maintainAspectRatio: false
            }}
        />
    )
}