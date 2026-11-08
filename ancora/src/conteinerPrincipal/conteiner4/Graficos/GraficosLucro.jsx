import { useLayoutEffect, useRef, useState } from "react";
import { Line } from "react-chartjs-2";
import { useUserStore } from "../../../useUseSotore";
import DataLucro from "../data/DataLucro.json"

const DEFAULT_COLORS = {
    accent: "#3b82f6",
    accentSoft: "#15c0b7",
    card: "#fff",
    text: "#333",
    tooltipText: "#fff",
    muted: "#555",
    grid: "rgba(0,0,0,0.1)",
    highlight: "#22c55e",
};

export default function GraficoLucro() {
    const containerRef = useRef(null);
    const chatThemeId = useUserStore((state) => state.chatThemeId);
    const [colors, setColors] = useState(DEFAULT_COLORS);

    useLayoutEffect(() => {
        const themeContainer = containerRef.current?.closest(".conteinerPrincipal");
        if (!themeContainer) return;

        const styles = getComputedStyle(themeContainer);
        const getColor = (name, fallback) => styles.getPropertyValue(name).trim() || fallback;
        setColors({
            accent: getColor("--chat-chart-accent", DEFAULT_COLORS.accent),
            accentSoft: getColor("--chat-chart-accent-soft", DEFAULT_COLORS.accentSoft),
            card: getColor("--chat-chart-card", DEFAULT_COLORS.card),
            text: getColor("--chat-chart-text", DEFAULT_COLORS.text),
            tooltipText: getColor("--chat-chart-tooltip-text", DEFAULT_COLORS.tooltipText),
            muted: getColor("--chat-chart-muted", DEFAULT_COLORS.muted),
            grid: getColor("--chat-chart-grid", DEFAULT_COLORS.grid),
            highlight: getColor("--chat-chart-3", DEFAULT_COLORS.highlight),
        });
    }, [chatThemeId]);

    return (
        <div ref={containerRef} className="grafico-lucro-theme">
                        <Line
                            data={{
                                labels: DataLucro.map((data) => data.label),
                                datasets: [
                                    {
                                        label: "Lucro Obtido",
                                        data: DataLucro.map((data) => data.value),
        
                                        borderColor: colors.accent,
                                        borderWidth: 3,
        
                                        fill: true,
        
                                        // ✅ GRADIENTE CORRIGIDO
                                        backgroundColor: (context) => {
                                            const chart = context.chart;
                                            const { ctx, chartArea } = chart;
        
                                            if (!chartArea) return colors.accent;
        
                                            const gradient = ctx.createLinearGradient(
                                                0,
                                                chartArea.top,
                                                0,
                                                chartArea.bottom
                                            );
        
                                            gradient.addColorStop(0, colors.accentSoft);
                                            gradient.addColorStop(1, "transparent");
        
                                            return gradient;
                                        },
        
                                        tension: 0.4,
        
                                        pointRadius: 5,
                                        pointHoverRadius: 7,
        
                                        // 🔥 Destaque automático do maior valor
                                        pointBackgroundColor: DataLucro.map((data) =>
                                            data.value === Math.max(...DataLucro.map(d => d.value))
                                                ? colors.highlight
                                                : colors.accent
                                        ),
        
                                        pointBorderWidth: 2,
                                        pointBorderColor: colors.card
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
                                            color: colors.text,
                                            font: {
                                                size: 14
                                            }
                                        }
                                    },
        
                                    tooltip: {
                                        backgroundColor: colors.accent,
                                        titleColor: colors.tooltipText,
                                        bodyColor: colors.tooltipText,
                                        padding: 10,
                                        borderWidth: 1,
                                        borderColor: colors.accent
                                    }
                                },
        
                                scales: {
                                    x: {
                                        ticks: {
                                            color: colors.muted
                                        },
                                        grid: {
                                            display: false
                                        }
                                    },
                                    y: {
                                        ticks: {
                                            color: colors.muted
                                        },
                                        grid: {
                                            color: colors.grid
                                        }
                                    }
                                }
                            }}
                        />
        </div>
    )
}