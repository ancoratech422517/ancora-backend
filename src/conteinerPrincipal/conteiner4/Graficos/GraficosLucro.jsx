import { useState } from "react";
import { Chart as Chartjs } from "chart.js/auto"
import { Line } from "react-chartjs-2";
import DataLucro from "../data/DataLucro.json"

export default function GraficoLucro () {
    return (
                        <Line
                            data={{
                                labels: DataLucro.map((data) => data.label),
                                datasets: [
                                    {
                                        label: "Lucro Obtido",
                                        data: DataLucro.map((data) => data.value),
        
                                        borderColor: "#3b82f6",
                                        borderWidth: 3,
        
                                        fill: true,
        
                                        // ✅ GRADIENTE CORRIGIDO
                                        backgroundColor: (context) => {
                                            const chart = context.chart;
                                            const { ctx, chartArea } = chart;
        
                                            if (!chartArea) return null;
        
                                            const gradient = ctx.createLinearGradient(
                                                0,
                                                chartArea.top,
                                                0,
                                                chartArea.bottom
                                            );
        
                                            gradient.addColorStop(0, "rgba(21, 192, 183, 0.5)");
                                            gradient.addColorStop(1, "rgba(59,130,246,0)");
        
                                            return gradient;
                                        },
        
                                        tension: 0.4,
        
                                        pointRadius: 5,
                                        pointHoverRadius: 7,
        
                                        // 🔥 Destaque automático do maior valor
                                        pointBackgroundColor: DataLucro.map((data) =>
                                            data.value === Math.max(...DataLucro.map(d => d.value))
                                                ? "#22c55e"
                                                : "#3b82f6"
                                        ),
        
                                        pointBorderWidth: 2,
                                        pointBorderColor: "#fff"
                                    }
                                ]
                            }}
                            options={{
                                responsive: true,
                                maintainAspectRatio: false,
        
                                plugins: {
                                    legend: {
                                        display: true,
                                        labels: {
                                            color: "#333",
                                            font: {
                                                size: 14
                                            }
                                        }
                                    },
        
                                    tooltip: {
                                        backgroundColor: "#111",
                                        titleColor: "#fff",
                                        bodyColor: "#fff",
                                        padding: 10,
                                        borderWidth: 1,
                                        borderColor: "#3b82f6"
                                    }
                                },
        
                                scales: {
                                    x: {
                                        ticks: {
                                            color: "#555"
                                        },
                                        grid: {
                                            display: false
                                        }
                                    },
                                    y: {
                                        ticks: {
                                            color: "#555"
                                        },
                                        grid: {
                                            color: "rgba(0,0,0,0.1)"
                                        }
                                    }
                                }
                            }}
                        />
        
    )
}