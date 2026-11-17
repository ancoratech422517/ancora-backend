import { useEffect, useMemo, useRef, useState } from "react";
import "./css/Conteiner4ConteinerCliente.css";
import Conteiner4ConteinerClienteDados from "./Conteiner4ConteinerClienteDados";
import useLojaDashboard from "./useLojaDashboard";

const X0 = 44;
const X1 = 690;
const Y0 = 30;
const Y1 = 490;
const PADDING = 34;
const CHART_MAX = (value) => Math.max(5, Math.ceil(value / 5) * 5);
const formatarQuantidade = (value) => new Intl.NumberFormat("pt-AO").format(Number(value) || 0);
const EMPTY_SERIES = [];

export default function Conteiner4CoteinerCliente() {
    const [animado, setAnimado] = useState(false);
    const [indiceAtivo, setIndiceAtivo] = useState(null);
    const [posicaoTooltip, setPosicaoTooltip] = useState(null);
    const [toast, setToast] = useState("");
    const [toastVisivel, setToastVisivel] = useState(false);
    const graficoRef = useRef(null);
    const toastTimer = useRef(null);
    const { dashboard, loading, error, refresh } = useLojaDashboard();
    const dados = dashboard?.clientes_serie || EMPTY_SERIES;
    const clientes = dashboard?.clientes_detalhe || [];
    const maxValue = CHART_MAX(Math.max(0, ...dados.map((item) => Number(item.value) || 0)));

    const pontos = useMemo(() => {
        const step = dados.length > 1
            ? (X1 - X0 - PADDING * 2) / (dados.length - 1)
            : 0;
        return dados.map((item, index) => ({
            ...item,
            x: X0 + PADDING + step * index,
            y: Y1 - ((Number(item.value) || 0) / maxValue) * (Y1 - Y0),
        }));
    }, [dados, maxValue]);

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
        const frame = requestAnimationFrame(() => setAnimado(true));
        return () => cancelAnimationFrame(frame);
    }, [dados]);

    useEffect(() => () => clearTimeout(toastTimer.current), []);

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
                <div className="clientes-grafico-legenda"><i aria-hidden="true" />Novos clientes por mês</div>
                <svg
                    className="clientes-grafico-svg"
                    viewBox="0 0 700 540"
                    role="img"
                    aria-label="Novos clientes da conta por mês"
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
                    {Array.from({ length: 6 }, (_, index) => maxValue * (5 - index) / 5).map((value, index) => {
                        const y = Y1 - (value / maxValue) * (Y1 - Y0);
                        return (
                            <g key={`${value}-${index}`}>
                                <line className="clientes-grafico-grade" x1={X0} x2={X1} y1={y} y2={y} strokeDasharray={value > 0 ? "3 6" : "0"} />
                                <text className="clientes-grafico-y-label" x={X0 - 9} y={y + 4}>{formatarQuantidade(value)}</text>
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
                                {formatarQuantidade(point.value)}
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
                        {formatarQuantidade(pontoAtivo.value)} novos clientes
                    </div>
                )}
                {!dashboard && (
                    <div className="clientes-grafico-estado" role={error ? "alert" : "status"}>
                        <span>{loading ? "A carregar clientes…" : error || "Não foi possível carregar os clientes."}</span>
                        {!loading && <button type="button" onClick={() => void refresh()}>Tentar novamente</button>}
                    </div>
                )}
            </section>
            <section className="clientes-lista" aria-label="Clientes">
                {clientes.map((cliente, index) => (
                    <Conteiner4ConteinerClienteDados
                        key={cliente.id}
                        nome={cliente.nome}
                        foto={cliente.foto}
                        descricao={`${formatarQuantidade(cliente.pedidos)} pedido(s) · Mais comprado: ${cliente.produto_mais_comprado || "Sem produto"}`}
                        atraso={index}
                        onConversar={() => conversar(cliente.nome)}
                    />
                ))}
                {dashboard && clientes.length === 0 && <p className="clientes-lista-vazia">Ainda não há clientes com pedidos registados nesta conta.</p>}
            </section>
            <div className={`clientes-toast${toastVisivel ? " is-visible" : ""}`} role="status" aria-live="polite">
                {toast}
            </div>
        </div>
    );
}
