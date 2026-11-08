import { useEffect, useMemo, useRef, useState } from "react";
import "./css/Conteiner4WindowGrafico.css";
import DadosGraficoJson from "./data/DataGrafico.json";

const CORES = [
    "var(--chat-chart-1, #36d9db)",
    "var(--chat-chart-2, #58d68d)",
    "var(--chat-chart-3, #5dade2)",
    "var(--chat-chart-4, #48c9b0)",
    "var(--chat-chart-5, #aeb6b8)",
];
const X0 = 44;
const X1 = 610;
const Y0 = 20;
const Y1 = 272;
const MAX_VALUE = 90;
const DONUT_RADIUS = 104;
const DONUT_CIRCUMFERENCE = 2 * Math.PI * DONUT_RADIUS;

function useTooltip() {
    const containerRef = useRef(null);
    const [tooltip, setTooltip] = useState(null);

    const showTooltip = (event, item, total) => {
        const bounds = containerRef.current?.getBoundingClientRect();
        if (!bounds) return;

        setTooltip({
            name: item.labe,
            value: item.value,
            percentage: Math.round((item.value / total) * 100),
            left: Math.min(event.clientX - bounds.left + 12, bounds.width - 130),
            top: event.clientY - bounds.top - 38,
        });
    };

    return { containerRef, tooltip, showTooltip, hideTooltip: () => setTooltip(null) };
}

function Tooltip({ tooltip }) {
    if (!tooltip) return null;

    return (
        <div className="dashboard-chart-tooltip" style={{ left: tooltip.left, top: tooltip.top }}>
            <strong>{tooltip.name}</strong>
            <br />
            {tooltip.value} Kz · {tooltip.percentage}%
        </div>
    );
}

export default function Conteiner4WindowGrafico() {
    const [visiveis, setVisiveis] = useState(() => DadosGraficoJson.map(() => true));
    const [chaveAnimada, setChaveAnimada] = useState(null);
    const [itemAtivo, setItemAtivo] = useState(null);
    const indicesVisiveis = useMemo(
        () => DadosGraficoJson.map((_, index) => index).filter((index) => visiveis[index]),
        [visiveis],
    );
    const chaveVisivel = indicesVisiveis.join(",");
    const animado = chaveAnimada === chaveVisivel;
    const dadosVisiveis = indicesVisiveis.map((index) => DadosGraficoJson[index]);
    const total = dadosVisiveis.reduce((sum, item) => sum + item.value, 0);
    const { containerRef: barrasRef, tooltip: tooltipBarras, showTooltip: mostrarTooltipBarras, hideTooltip: ocultarTooltipBarras } = useTooltip();
    const { containerRef: roscaRef, tooltip: tooltipRosca, showTooltip: mostrarTooltipRosca, hideTooltip: ocultarTooltipRosca } = useTooltip();

    useEffect(() => {
        const frame = requestAnimationFrame(() => setChaveAnimada(chaveVisivel));
        return () => cancelAnimationFrame(frame);
    }, [chaveVisivel]);

    const alternarItem = (index) => {
        if (visiveis[index] && indicesVisiveis.length === 1) return;
        setItemAtivo(null);
        setVisiveis((current) => current.map((isVisible, itemIndex) => itemIndex === index ? !isVisible : isVisible));
    };

    const pontos = dadosVisiveis.map((item, index) => {
        const step = (X1 - X0) / dadosVisiveis.length;
        const centerX = X0 + step * (index + 0.5);
        const centerY = Y1 - (item.value / MAX_VALUE) * (Y1 - Y0);
        return { item, index: indicesVisiveis[index], x: centerX, y: centerY };
    });

    let trendPath = "";
    if (pontos.length > 1) {
        trendPath = `M${pontos[0].x},${pontos[0].y}`;
        for (let index = 1; index < pontos.length; index += 1) {
            const previous = pontos[index - 1];
            const current = pontos[index];
            const middleX = (previous.x + current.x) / 2;
            trendPath += ` C${middleX},${previous.y} ${middleX},${current.y} ${current.x},${current.y}`;
        }
    }

    const segmentosRosca = dadosVisiveis.map((item, index) => {
        const length = (item.value / total) * DONUT_CIRCUMFERENCE;
        const visibleLength = Math.max(length - 4, 1);
        const offset = dadosVisiveis
            .slice(0, index)
            .reduce((sum, previous) => sum + (previous.value / total) * DONUT_CIRCUMFERENCE, 0);
        return { item, index, visibleLength, offset };
    });
    const valorCentral = itemAtivo
        ? `${Math.round((itemAtivo.value / total) * 100)}%`
        : total;

    return (
        <section className="Conteiner4WindowGrafico" aria-label="Gráficos do dashboard">
            <article className="dashboard-chart dashboard-chart-bar-card" ref={barrasRef}>
                <h4><i aria-hidden="true" />Receita (Kz)</h4>
                <svg viewBox="0 0 620 330" role="img" aria-label="Receita por categoria">
                    <defs>
                        {DadosGraficoJson.map((item, index) => (
                            <linearGradient key={item.labe} id={`dashboard-gradient-${index}`} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0" stopColor={CORES[index]} stopOpacity="0.9" />
                                <stop offset="1" stopColor={CORES[index]} stopOpacity="0.55" />
                            </linearGradient>
                        ))}
                        <clipPath id="dashboard-bars-clip">
                            <rect x="0" y="0" width="620" height={Y1} />
                        </clipPath>
                    </defs>
                    {Array.from({ length: 10 }, (_, index) => index * 10).map((value) => {
                        const y = Y1 - (value / MAX_VALUE) * (Y1 - Y0);
                        return (
                            <g key={value}>
                                <line
                                    className="dashboard-chart-grid"
                                    x1={X0}
                                    x2={X1}
                                    y1={y}
                                    y2={y}
                                    strokeDasharray={value ? "3 5" : "0"}
                                />
                                <text className="dashboard-chart-y-label" x={X0 - 8} y={y + 4}>{value}</text>
                            </g>
                        );
                    })}
                    <g className="dashboard-chart-bars" clipPath="url(#dashboard-bars-clip)">
                        {pontos.map(({ item, index, x }) => {
                            const step = (X1 - X0) / dadosVisiveis.length;
                            const barWidth = Math.min(84, step * 0.62);
                            const height = (item.value / MAX_VALUE) * (Y1 - Y0);
                            const y = animado ? Y1 - height : Y1;
                            return (
                                <g key={item.labe}>
                                    <rect
                                        className="dashboard-chart-bar"
                                        x={x - barWidth / 2}
                                        y={y}
                                        width={barWidth}
                                        height={animado ? height + 14 : 0}
                                        rx="12"
                                        fill={`url(#dashboard-gradient-${index})`}
                                        onPointerMove={(event) => mostrarTooltipBarras(event, item, total)}
                                        onPointerLeave={ocultarTooltipBarras}
                                    />
                                    <text
                                        className="dashboard-chart-value"
                                        x={x}
                                        y={animado ? Y1 - height - 26 : Y1 - 8}
                                        opacity={animado ? 1 : 0}
                                    >
                                        {item.value}
                                    </text>
                                    <text className="dashboard-chart-x-label" x={x} y={Y1 + 24}>{item.labe}</text>
                                </g>
                            );
                        })}
                    </g>
                    {trendPath && (
                        <>
                            <path
                                className={`dashboard-chart-trend${animado ? " is-animated" : ""}`}
                                d={trendPath}
                                transform="translate(0,-14)"
                            />
                            {pontos.map(({ item, x, y }) => (
                                <circle
                                    key={item.labe}
                                    className={`dashboard-chart-dot${animado ? " is-animated" : ""}`}
                                    cx={x}
                                    cy={y - 14}
                                    r="5"
                                />
                            ))}
                        </>
                    )}
                </svg>
                <Tooltip tooltip={tooltipBarras} />
            </article>

            <article className="dashboard-chart dashboard-chart-donut" ref={roscaRef}>
                <svg viewBox="0 0 360 330" role="img" aria-label="Distribuição da receita">
                    <circle
                        cx="180"
                        cy="165"
                        r={DONUT_RADIUS}
                        fill="none"
                        stroke="var(--dashboard-grid)"
                        strokeWidth="46"
                        opacity="0.6"
                    />
                    <g className="dashboard-chart-ring" transform="rotate(-90 180 165)">
                        {segmentosRosca.map(({ item, index, visibleLength, offset }) => (
                            <circle
                                key={item.labe}
                                className="dashboard-chart-segment"
                                cx="180"
                                cy="165"
                                r={DONUT_RADIUS}
                                stroke={CORES[index]}
                                strokeDasharray={`${animado ? visibleLength : 0} ${DONUT_CIRCUMFERENCE - (animado ? visibleLength : 0)}`}
                                strokeDashoffset={-offset}
                                style={{ transitionDelay: `${120 + index * 170}ms` }}
                                onPointerEnter={() => setItemAtivo(item)}
                                onPointerMove={(event) => mostrarTooltipRosca(event, item, total)}
                                onPointerLeave={() => {
                                    setItemAtivo(null);
                                    ocultarTooltipRosca();
                                }}
                            />
                        ))}
                    </g>
                    <text className="dashboard-chart-center-label" x="180" y="157">
                        {itemAtivo ? itemAtivo.labe : "Receita total"}
                    </text>
                    <text className="dashboard-chart-center-value" x="180" y="193">{valorCentral}</text>
                </svg>
                <div className="dashboard-chart-legend">
                    {DadosGraficoJson.map((item, index) => (
                        <button
                            key={item.labe}
                            type="button"
                            className={`dashboard-chart-chip${visiveis[index] ? "" : " is-off"}`}
                            style={{ "--chip-color": CORES[index] }}
                            aria-pressed={visiveis[index]}
                            onClick={() => alternarItem(index)}
                        >
                            <i aria-hidden="true" />
                            {item.labe}
                        </button>
                    ))}
                </div>
                <Tooltip tooltip={tooltipRosca} />
            </article>
        </section>
    );
}
