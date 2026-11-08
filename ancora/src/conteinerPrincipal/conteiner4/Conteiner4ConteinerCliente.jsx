import { useEffect, useMemo, useRef, useState } from "react";
import "./css/Conteiner4ConteinerCliente.css";
import DataCliente from "./data/DataCliente.json";
import Conteiner4ConteinerClienteDados from "./Conteiner4ConteinerClienteDados";

const X0 = 44;
const X1 = 690;
const Y0 = 30;
const Y1 = 490;
const MIN_VALUE = 20;
const MAX_VALUE = 180;
const PADDING = 34;
const CLIENTES = Array.from({ length: 5 }, (_, index) => ({
    id: index,
    nome: "Cláudio Avelino",
    descricao: "Cliente dos aparelho eletronico",
}));

export default function Conteiner4CoteinerCliente() {
    const [animado, setAnimado] = useState(false);
    const [valores, setValores] = useState(() => DataCliente.map(() => 0));
    const [indiceAtivo, setIndiceAtivo] = useState(null);
    const [posicaoTooltip, setPosicaoTooltip] = useState(null);
    const [toast, setToast] = useState("");
    const [toastVisivel, setToastVisivel] = useState(false);
    const graficoRef = useRef(null);
    const toastTimer = useRef(null);

    const pontos = useMemo(() => {
        const step = DataCliente.length > 1
            ? (X1 - X0 - PADDING * 2) / (DataCliente.length - 1)
            : 0;
        return DataCliente.map((item, index) => ({
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
        const animar = (agora) => {
            const decorrido = agora - inicio;
            setAnimado(decorrido > 50);
            setValores(DataCliente.map((item, index) => {
                const progresso = Math.max(0, Math.min(1, (decorrido - index * 400) / 1000));
                return Math.round(item.value * (1 - (1 - progresso) ** 4));
            }));
            if (decorrido < (DataCliente.length - 1) * 400 + 1000) {
                frame = requestAnimationFrame(animar);
            }
        };
        frame = requestAnimationFrame(animar);
        return () => {
            cancelAnimationFrame(frame);
            clearTimeout(toastTimer.current);
        };
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

    const conversar = (nome) => {
        setToast(`A abrir conversa com ${nome}…`);
        setToastVisivel(true);
        clearTimeout(toastTimer.current);
        toastTimer.current = setTimeout(() => setToastVisivel(false), 2200);
    };

    const pontoAtivo = indiceAtivo === null ? null : pontos[indiceAtivo];

    return (
        <div className="Conteiner4ConteinerCliente">
            <section className="clientes-grafico" ref={graficoRef}>
                <div className="clientes-grafico-legenda"><i aria-hidden="true" />Clientes Óbtidos</div>
                <svg
                    className="clientes-grafico-svg"
                    viewBox="0 0 700 540"
                    role="img"
                    aria-label="Clientes obtidos por mês"
                    onPointerMove={exibirTooltip}
                    onPointerLeave={() => {
                        setIndiceAtivo(null);
                        setPosicaoTooltip(null);
                    }}
                >
                    <defs>
                        <linearGradient id="clientes-gradiente-linha" x1="0" y1="0" x2="1" y2="0">
                            <stop offset="0" stopColor="var(--chat-chart-accent, #2ec4b0)" />
                            <stop offset="1" stopColor="var(--chat-chart-accent-soft, #0b7a73)" />
                        </linearGradient>
                        <linearGradient id="clientes-gradiente-area" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0" stopColor="var(--chat-chart-accent)" stopOpacity=".38" />
                            <stop offset="1" stopColor="var(--chat-chart-accent)" stopOpacity="0" />
                        </linearGradient>
                        <clipPath id="clientes-revelar-grafico">
                            <rect className={`clientes-grafico-revelar${animado ? " is-active" : ""}`} x="0" y="0" width={animado ? 700 : 0} height="560" />
                        </clipPath>
                    </defs>
                    {Array.from({ length: 9 }, (_, index) => MIN_VALUE + index * 20).map((value) => {
                        const y = Y1 - ((value - MIN_VALUE) / (MAX_VALUE - MIN_VALUE)) * (Y1 - Y0);
                        return (
                            <g key={value}>
                                <line className="clientes-grafico-grade" x1={X0} x2={X1} y1={y} y2={y} strokeDasharray={value > MIN_VALUE ? "3 6" : "0"} />
                                <text className="clientes-grafico-y-label" x={X0 - 9} y={y + 4}>{value}</text>
                            </g>
                        );
                    })}
                    {pontos.map((point) => (
                        <text className="clientes-grafico-x-label" key={point.label} x={point.x} y={Y1 + 26}>{point.label}</text>
                    ))}
                    <g clipPath="url(#clientes-revelar-grafico)">
                        <path className="clientes-grafico-area" d={area} />
                        <path className="clientes-grafico-linha" d={caminho} />
                    </g>
                    {pontos.map((point, index) => (
                        <g key={point.label}>
                            <circle
                                className={`clientes-grafico-pulso${animado && index === pontos.length - 1 ? " is-active" : ""}`}
                                cx={point.x}
                                cy={point.y}
                                r="7"
                            />
                            <circle
                                className={`clientes-grafico-ponto${animado ? " is-active" : ""}${indiceAtivo === index ? " is-hovered" : ""}`}
                                cx={point.x}
                                cy={point.y}
                                r="6.5"
                            />
                            <text
                                className="clientes-grafico-valor"
                                x={point.x + (index === pontos.length - 1 ? -26 : 0)}
                                y={point.y - (index === pontos.length - 1 ? -4 : 16)}
                                opacity={animado ? 1 : 0}
                            >
                                {valores[index] ?? point.value}
                            </text>
                        </g>
                    ))}
                    {pontoAtivo && (
                        <line className="clientes-grafico-cruz" x1={pontoAtivo.x} x2={pontoAtivo.x} y1={Y0} y2={Y1} />
                    )}
                    <rect
                        className="clientes-grafico-area-interativa"
                        x={X0}
                        y="0"
                        width={X1 - X0}
                        height={Y1 + 40}
                    />
                </svg>
                {pontoAtivo && (
                    <div className="clientes-grafico-tooltip" style={{ left: posicaoTooltip?.left, top: posicaoTooltip?.top }}>
                        <strong>{pontoAtivo.label}</strong>
                        <br />
                        {pontoAtivo.value} clientes
                    </div>
                )}
            </section>
            <section className="clientes-lista" aria-label="Clientes">
                {CLIENTES.map((cliente, index) => (
                    <Conteiner4ConteinerClienteDados
                        key={cliente.id}
                        nome={cliente.nome}
                        descricao={cliente.descricao}
                        atraso={index}
                        onConversar={() => conversar(cliente.nome)}
                    />
                ))}
            </section>
            <div className={`clientes-toast${toastVisivel ? " is-visible" : ""}`} role="status" aria-live="polite">
                {toast}
            </div>
        </div>
    );
}
