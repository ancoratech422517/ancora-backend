import { useEffect, useMemo, useRef, useState } from "react";
import "./css/Conteiner4ConteinerAfiliado.css";
import DataAfiliado from "./data/DataAfiliado.json";
import Conteiner4ConteinerAfiliadoDados from "./Conteiner4ConteinerAfiliadoDados";

const X0 = 44;
const X1 = 690;
const Y0 = 30;
const Y1 = 490;
const MIN_VALUE = 0;
const MAX_VALUE = 40;
const PADDING = 34;
const AFILIADOS = Array.from({ length: 5 }, (_, index) => ({
    id: index,
    nome: "Cláudio Avelino",
    descricao: "Afiliado ativo · Produtos",
}));

export default function Conteiner4ConteinerAfifliado() {
    const [animado, setAnimado] = useState(false);
    const [valores, setValores] = useState(() => DataAfiliado.map(() => 0));
    const [indiceAtivo, setIndiceAtivo] = useState(null);
    const [posicaoTooltip, setPosicaoTooltip] = useState(null);
    const graficoRef = useRef(null);

    const pontos = useMemo(() => {
        const step = DataAfiliado.length > 1
            ? (X1 - X0 - PADDING * 2) / (DataAfiliado.length - 1)
            : 0;
        return DataAfiliado.map((item, index) => ({
            ...item,
            x: X0 + PADDING + step * index,
            y: Y1 - ((item.value - MIN_VALUE) / (MAX_VALUE - MIN_VALUE)) * (Y1 - Y0),
        }));
    }, []);

    const caminho = pontos.map(({ x, y }, index) => {
        if (index === 0) return `M${x},${y}`;
        const anterior = pontos[index - 1];
        const meio = (anterior.x + x) / 2;
        return `C${meio},${anterior.y} ${meio},${y} ${x},${y}`;
    }).join(" ");
    const area = pontos.length
        ? `${caminho} L${pontos[pontos.length - 1].x},${Y1} L${pontos[0].x},${Y1} Z`
        : "";

    useEffect(() => {
        let frame;
        const inicio = performance.now();
        const animarGrafico = (agora) => {
            const decorrido = agora - inicio;
            setAnimado(decorrido > 50);
            setValores(DataAfiliado.map((item, index) => {
                const progresso = Math.max(0, Math.min(1, (decorrido - index * 400) / 1000));
                return Math.round(item.value * (1 - (1 - progresso) ** 4));
            }));
            if (decorrido < (DataAfiliado.length - 1) * 400 + 1000) {
                frame = requestAnimationFrame(animarGrafico);
            }
        };
        frame = requestAnimationFrame(animarGrafico);
        return () => cancelAnimationFrame(frame);
    }, []);

    const exibirTooltip = (event) => {
        if (!pontos.length || !graficoRef.current) return;
        const svg = event.currentTarget;
        const bounds = svg.getBoundingClientRect();
        const containerBounds = graficoRef.current.getBoundingClientRect();
        const pointerX = ((event.clientX - bounds.left) / bounds.width) * 700;
        const index = pontos.reduce((closest, point, pointIndex) => (
            Math.abs(point.x - pointerX) < Math.abs(pontos[closest].x - pointerX) ? pointIndex : closest
        ), 0);
        setIndiceAtivo(index);
        const point = pontos[index];
        setPosicaoTooltip({
            left: Math.min(
                (point.x / 700) * bounds.width + bounds.left - containerBounds.left + 14,
                containerBounds.width - 120,
            ),
            top: bounds.top - containerBounds.top + (point.y / 540) * bounds.height - 12,
        });
    };

    const pontoAtivo = indiceAtivo === null ? null : pontos[indiceAtivo];

    return (
        <div className="Conteiner4ConteinerAfiliado">
            <section className="afiliados-grafico" ref={graficoRef}>
                <div className="afiliados-grafico-legenda"><i aria-hidden="true" />Afiliados obtidos</div>
                <svg
                    className="afiliados-grafico-svg"
                    viewBox="0 0 700 540"
                    role="img"
                    aria-label="Afiliados obtidos por mês"
                    onPointerMove={exibirTooltip}
                    onPointerLeave={() => {
                        setIndiceAtivo(null);
                        setPosicaoTooltip(null);
                    }}
                >
                    <defs>
                        <linearGradient id="afiliados-gradiente-linha" x1="0" y1="0" x2="1" y2="0">
                            <stop offset="0" stopColor="var(--chat-chart-accent, #2ec4b0)" />
                            <stop offset="1" stopColor="var(--chat-chart-accent-soft, #0b7a73)" />
                        </linearGradient>
                        <linearGradient id="afiliados-gradiente-area" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0" stopColor="var(--chat-chart-accent)" stopOpacity=".38" />
                            <stop offset="1" stopColor="var(--chat-chart-accent)" stopOpacity="0" />
                        </linearGradient>
                        <clipPath id="afiliados-revelar-grafico">
                            <rect
                                className={`afiliados-grafico-revelar${animado ? " is-active" : ""}`}
                                x="0"
                                y="0"
                                width={animado ? 700 : 0}
                                height="560"
                            />
                        </clipPath>
                    </defs>
                    {Array.from({ length: 9 }, (_, index) => MIN_VALUE + index * 5).map((value) => {
                        const y = Y1 - ((value - MIN_VALUE) / (MAX_VALUE - MIN_VALUE)) * (Y1 - Y0);
                        return (
                            <g key={value}>
                                <line
                                    className="afiliados-grafico-grade"
                                    x1={X0}
                                    x2={X1}
                                    y1={y}
                                    y2={y}
                                    strokeDasharray={value > MIN_VALUE ? "3 6" : "0"}
                                />
                                <text className="afiliados-grafico-y-label" x={X0 - 9} y={y + 4}>{value}</text>
                            </g>
                        );
                    })}
                    {pontos.map((point) => (
                        <text className="afiliados-grafico-x-label" key={point.label} x={point.x} y={Y1 + 26}>
                            {point.label}
                        </text>
                    ))}
                    <g clipPath="url(#afiliados-revelar-grafico)">
                        <path className="afiliados-grafico-area" d={area} />
                        <path className="afiliados-grafico-linha" d={caminho} />
                    </g>
                    {pontos.map((point, index) => (
                        <g key={point.label}>
                            <circle
                                className={`afiliados-grafico-pulso${animado && index === pontos.length - 1 ? " is-active" : ""}`}
                                cx={point.x}
                                cy={point.y}
                                r="7"
                            />
                            <circle
                                className={`afiliados-grafico-ponto${animado ? " is-active" : ""}${indiceAtivo === index ? " is-hovered" : ""}`}
                                cx={point.x}
                                cy={point.y}
                                r="6.5"
                            />
                            <text
                                className="afiliados-grafico-valor"
                                x={point.x + (index === pontos.length - 1 ? -26 : 0)}
                                y={point.y - (index === pontos.length - 1 ? -4 : 16)}
                                opacity={animado ? 1 : 0}
                            >
                                {valores[index] ?? point.value}
                            </text>
                        </g>
                    ))}
                    {pontoAtivo && (
                        <line
                            className="afiliados-grafico-cruz"
                            x1={pontoAtivo.x}
                            x2={pontoAtivo.x}
                            y1={Y0}
                            y2={Y1}
                        />
                    )}
                    <rect
                        className="afiliados-grafico-area-interativa"
                        x={X0}
                        y="0"
                        width={X1 - X0}
                        height={Y1 + 40}
                    />
                </svg>
                {pontoAtivo && (
                    <div className="afiliados-grafico-tooltip" style={{ left: posicaoTooltip?.left, top: posicaoTooltip?.top }}>
                        <strong>{pontoAtivo.label}</strong>
                        <br />
                        {pontoAtivo.value} afiliados
                    </div>
                )}
            </section>
            <section className="afiliados-lista" aria-label="Afiliados">
                {AFILIADOS.map((afiliado, index) => (
                    <Conteiner4ConteinerAfiliadoDados
                        key={afiliado.id}
                        nome={afiliado.nome}
                        descricao={afiliado.descricao}
                        atraso={index}
                    />
                ))}
            </section>
        </div>
    );
}
