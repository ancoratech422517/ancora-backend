import { useState } from "react";
import "./css/Conteiner4WindowGrafico.css";
import MyChart from "../Conteiner4WindowGrafico"; // Aqui é o arquivo acima

export default function Conteiner4WindowGrafico() {
  return (
    <div className="Conteiner4WindowGrafico">
      <div className="grafico">
        <MyChart />
      </div>
    </div>
  );
}