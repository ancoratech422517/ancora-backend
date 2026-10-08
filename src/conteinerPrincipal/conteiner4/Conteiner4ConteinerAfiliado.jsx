import { useState } from "react";
import "./css/Conteiner4ConteinerAfiliado.css"
import {Chart as Chartjs} from "chart.js/auto"
import {Line} from "react-chartjs-2"
import DataAfiliado from "./data/DataAfiliado.json"
import Conteiner4ConteinerAfiliadoDados from "./Conteiner4ConteinerAfiliadoDados";
export default function Conteiner4ConteinerAfifliado () {
    return (
        <div className="Conteiner4ConteinerAfiliado">
            <div className="Conteiner4ConteinerAfifliadoBox">
                <Line
                    data={{
                        labels: DataAfiliado.map((data)=> data.label),
                        datasets:[
                            {
                                label: "Afiliados Óbtidos",
                                data: DataAfiliado.map((data)=> data.value)
                            }
                        ]
                    }}
                    options={{
                        responsive: true,
                        maintainAspectRatio: false
                    }}
                />
            </div>
            <div className="Conteiner4ConteinerAfifliadoBox">
                <Conteiner4ConteinerAfiliadoDados />
                <Conteiner4ConteinerAfiliadoDados />
                <Conteiner4ConteinerAfiliadoDados />
                <Conteiner4ConteinerAfiliadoDados />
                <Conteiner4ConteinerAfiliadoDados />
                <Conteiner4ConteinerAfiliadoDados />
                <Conteiner4ConteinerAfiliadoDados />
                <Conteiner4ConteinerAfiliadoDados />
                <Conteiner4ConteinerAfiliadoDados />
                <Conteiner4ConteinerAfiliadoDados />
                <Conteiner4ConteinerAfiliadoDados />
                <Conteiner4ConteinerAfiliadoDados />
                <Conteiner4ConteinerAfiliadoDados />
            </div>
        </div>
    )
}