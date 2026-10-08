import React from "react";
import { useState } from "react";
import "./css/Conteiner4ConteinerCliente.css"
import {Chart as Chartjs} from "chart.js/auto"
import {Line} from "react-chartjs-2"
import DataCliente from "./data/DataCliente.json"
import Conteiner4ConteinerClienteDados from "./Conteiner4ConteinerClienteDados";
export default function Conteiner4CoteinerCliente () {
    return (
        <div className="Conteiner4ConteinerCliente">
            <div className="Conteiner4CoteinerClienteBox">
                <Line
                    data={{
                        labels: DataCliente.map((data)=> data.label),
                        datasets:[
                            {
                                label:"Clientes Óbtidos",
                                data: DataCliente.map((data)=> data.value)
                            }
                        ]
                    }}
                    options={{
                        responsive: true,
                        maintainAspectRatio: false
                    }}
                />
            </div>
            <div className="Conteiner4CoteinerClienteBox">
                <Conteiner4ConteinerClienteDados />
                <Conteiner4ConteinerClienteDados />
                <Conteiner4ConteinerClienteDados />
                <Conteiner4ConteinerClienteDados />
                <Conteiner4ConteinerClienteDados />
                <Conteiner4ConteinerClienteDados />
                <Conteiner4ConteinerClienteDados />
                <Conteiner4ConteinerClienteDados />
                <Conteiner4ConteinerClienteDados />
                <Conteiner4ConteinerClienteDados />
                <Conteiner4ConteinerClienteDados />
                <Conteiner4ConteinerClienteDados />
                <Conteiner4ConteinerClienteDados />
                <Conteiner4ConteinerClienteDados />
                <Conteiner4ConteinerClienteDados />
                <Conteiner4ConteinerClienteDados />
                <Conteiner4ConteinerClienteDados />
                <Conteiner4ConteinerClienteDados />
                <Conteiner4ConteinerClienteDados />
                <Conteiner4ConteinerClienteDados />
            </div>
        </div>
    )
}