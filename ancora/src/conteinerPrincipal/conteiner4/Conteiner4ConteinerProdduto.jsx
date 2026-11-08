import { createElement, useEffect, useMemo, useRef, useState } from "react";
import "./css/Conteiner4ConteinerProduto.css";
import DataProduto from "./data/DataProduto.json";
import CardProduto from "../conteiner2/Conteiner2RightWindowProdutsCard";
import Cart from "../components/conteinerSvg/cart";
import Erro from "../components/conteinerSvg/erro";
import Editar from "../components/conteinerSvg/editar";
import Mais from "../components/conteinerSvg/mais";
import { Formulario } from "./js/formulario";
import { useUserStore } from "../../useUseSotore";

const X0 = 48;
const X1 = 690;
const Y0 = 30;
const Y1 = 490;
const MAX_VALUE = 200;
const MODOS = [
    { id: "meus", label: "Meus produtos", icon: Cart },
    { id: "eliminar", label: "Eliminar produto", icon: Erro },
    { id: "editar", label: "Editar produto", icon: Editar },
    { id: "novo", label: "Novo produto", icon: Mais },
];

function ProdutoVazio({ mensagem }) {
    return (
        <div className="produto-vazio" key={mensagem}>
            <svg className="produto-vazio-ilustracao" viewBox="0 0 96 96" fill="none" aria-hidden="true">
                <path d="M48 14 82 30v36L48 82 14 66V30z" fill="var(--product-soft)" stroke="var(--product-accent)" strokeWidth="2.5" strokeLinejoin="round" />
                <path d="M14 30l34 16 34-16M48 46v36" stroke="var(--product-accent)" strokeWidth="2.5" strokeLinejoin="round" />
                <path d="M31 22l34 16" stroke="var(--product-dark)" strokeWidth="2.5" strokeLinecap="round" strokeDasharray="2 7" />
            </svg>
            <p>{mensagem}</p>
        </div>
    );
}

export default function Conteiner4ConteinerProduto() {
    const { ProdutoUsuario } = useUserStore();
    const [modoGrafico, setModoGrafico] = useState("bar");
    const [modoProduto, setModoProduto] = useState("meus");
    const [animado, setAnimado] = useState(false);
    const [tooltip, setTooltip] = useState(null);
    const caixaGraficoRef = useRef(null);
    const dados = useMemo(
        () => DataProduto.filter((item) => Number.isFinite(Number(item.value))),
        [],
    );
    const total = dados.reduce((sum, item) => sum + Number(item.value), 0);
    const media = dados.length ? total / dados.length : 0;
    const pontos = dados.map((item, index) => {
        const step = (X1 - X0) / dados.length;
        const x = X0 + step * (index + 0.5);
        const y = Y1 - (Number(item.value) / MAX_VALUE) * (Y1 - Y0);
        return { item, x, y };
    });
    const linha = pontos.map(({ x, y }, index) => {
        if (index === 0) return `M${x},${y}`;
        const anterior = pontos[index - 1];
        const meio = (anterior.x + x) / 2;
        return `C${meio},${anterior.y} ${meio},${y} ${x},${y}`;
    }).join(" ");
    const area = pontos.length
        ? `${linha} L${pontos[pontos.length - 1].x},${Y1} L${pontos[0].x},${Y1} Z`
        : "";
    const produtos = Array.isArray(ProdutoUsuario) ? ProdutoUsuario : [];
    const mensagensVazias = {
        meus: "Você ainda não tem produtos registrados.",
        eliminar: "Não há produtos para eliminar.",
        editar: "Não há produtos para editar.",
        novo: "Comece por registar o seu primeiro produto.",
    };

    useEffect(() => {
        const frame = requestAnimationFrame(() => setAnimado(true));
        return () => cancelAnimationFrame(frame);
    }, [modoGrafico]);

    const mostrarTooltip = (event, item) => {
        const bounds = caixaGraficoRef.current?.getBoundingClientRect();
        if (!bounds) return;
        setTooltip({
            nome: item.label,
            valor: Number(item.value),
            esquerda: Math.min(event.clientX - bounds.left + 12, bounds.width - 150),
            topo: event.clientY - bounds.top - 40,
        });
    };

    const alterarModoGrafico = (modo) => {
        setAnimado(false);
        setTooltip(null);
        setModoGrafico(modo);
    };

    const selecionarModoProduto = (modo) => {
        setModoProduto(modo);
        if (modo === "novo") Formulario(null, "novo_produto");
    };

    return (
        <div className="Conteiner4ConteinerProduto">
            <section className="produto-grafico" ref={caixaGraficoRef}>
                <div className="produto-grafico-cabecalho">
                    <div className="produto-grafico-legenda"><i aria-hidden="true" />revenue</div>
                    <div className="produto-grafico-alternador" role="group" aria-label="Tipo de gráfico">
                        <span className={modoGrafico === "area" ? "produto-grafico-indicador is-area" : "produto-grafico-indicador"} />
                        <button
                            type="button"
                            className={modoGrafico === "bar" ? "is-active" : ""}
                            aria-pressed={modoGrafico === "bar"}
                            onClick={() => alterarModoGrafico("bar")}
                        >
                            Barras
                        </button>
                        <button
                            type="button"
                            className={modoGrafico === "area" ? "is-active" : ""}
                            aria-pressed={modoGrafico === "area"}
                            onClick={() => alterarModoGrafico("area")}
                        >
                            Área
                        </button>
                    </div>
                </div>
                <svg className={`produto-grafico-svg${modoGrafico === "area" ? " is-area" : ""}`} viewBox="0 0 700 540" role="img" aria-label="Receita por produto">
                    <defs>
                        <linearGradient id="produto-gradiente-barras" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0" stopColor="var(--chat-chart-accent, #3cc9b8)" />
                            <stop offset="1" stopColor="var(--chat-chart-accent-soft, #a8ebe2)" stopOpacity=".85" />
                        </linearGradient>
                        <linearGradient id="produto-gradiente-barra-destaque" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0" stopColor="var(--chat-chart-accent-soft, #0d8a80)" />
                            <stop offset="1" stopColor="var(--chat-chart-accent, #6fd3c7)" />
                        </linearGradient>
                        <linearGradient id="produto-gradiente-area" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0" stopColor="var(--chat-chart-accent)" stopOpacity=".45" />
                            <stop offset="1" stopColor="var(--chat-chart-accent)" stopOpacity="0" />
                        </linearGradient>
                        <clipPath id="produto-grafico-recorte">
                            <rect x="0" y="0" width="700" height="540" />
                        </clipPath>
                        <clipPath id="produto-area-recorte">
                            <rect className={`produto-area-recorte${animado ? " is-animated" : ""}`} x="0" y="0" width={animado ? 700 : 0} height="540" />
                        </clipPath>
                    </defs>
                    {Array.from({ length: 11 }, (_, index) => index * 20).map((value) => {
                        const y = Y1 - (value / MAX_VALUE) * (Y1 - Y0);
                        return (
                            <g key={value}>
                                <line className="produto-grafico-grade" x1={X0} x2={X1} y1={y} y2={y} strokeDasharray={value ? "3 6" : "0"} />
                                <text className="produto-grafico-y-label" x={X0 - 9} y={y + 4}>{value}</text>
                            </g>
                        );
                    })}
                    {pontos.map(({ item, x }) => {
                        return (
                            <text className="produto-grafico-x-label" key={item.label} x={x} y={Y1 + 26}>
                                {item.label}
                            </text>
                        );
                    })}
                    {modoGrafico === "bar" ? (
                        <g className="produto-grafico-barras" clipPath="url(#produto-grafico-recorte)">
                            {pontos.map(({ item, x }) => {
                                const step = (X1 - X0) / dados.length;
                                const largura = Math.min(120, step * 0.7);
                                const altura = (Number(item.value) / MAX_VALUE) * (Y1 - Y0);
                                return (
                                    <g key={item.label}>
                                        <rect
                                            className="produto-grafico-barra"
                                            x={x - largura / 2}
                                            y={animado ? Y1 - altura : Y1}
                                            width={largura}
                                            height={animado ? altura + 16 : 0}
                                            rx="14"
                                            fill={Number(item.value) === Math.max(...dados.map((entry) => Number(entry.value))) ? "url(#produto-gradiente-barra-destaque)" : "url(#produto-gradiente-barras)"}
                                            onPointerMove={(event) => mostrarTooltip(event, item)}
                                            onPointerLeave={() => setTooltip(null)}
                                        />
                                        <text className="produto-grafico-valor" x={x} y={animado ? Y1 - altura - 12 : Y1 - 8} opacity={animado ? 1 : 0}>
                                            {item.value}
                                        </text>
                                    </g>
                                );
                            })}
                        </g>
                    ) : (
                        <g clipPath="url(#produto-area-recorte)">
                            <path className="produto-grafico-area" d={area} />
                            <path className="produto-grafico-linha" d={linha} />
                            {pontos.map(({ item, x, y }) => (
                                <g key={item.label}>
                                    <text className="produto-grafico-valor" x={x} y={y - 16} opacity={animado ? 1 : 0}>{item.value}</text>
                                    <circle
                                        className="produto-grafico-ponto"
                                        cx={x}
                                        cy={y}
                                        r="6"
                                        onPointerMove={(event) => mostrarTooltip(event, item)}
                                        onPointerLeave={() => setTooltip(null)}
                                    />
                                </g>
                            ))}
                        </g>
                    )}
                    <line
                        className={`produto-grafico-media${animado ? " is-visible" : ""}`}
                        x1={X0}
                        x2={X1}
                        y1={Y1 - (media / MAX_VALUE) * (Y1 - Y0)}
                        y2={Y1 - (media / MAX_VALUE) * (Y1 - Y0)}
                    />
                    <g className={`produto-grafico-etiqueta-media${animado ? " is-visible" : ""}`}>
                        <rect x={X1 - 92} y={Y1 - (media / MAX_VALUE) * (Y1 - Y0) - 11} width="92" height="22" rx="11" />
                        <text x={X1 - 46} y={Y1 - (media / MAX_VALUE) * (Y1 - Y0) + 4}>
                            média {media.toLocaleString("pt-PT")}
                        </text>
                    </g>
                </svg>
                {tooltip && (
                    <div className="produto-grafico-tooltip" style={{ left: tooltip.esquerda, top: tooltip.topo }}>
                        <strong>{tooltip.nome}</strong>
                        <br />
                        {tooltip.valor} · {Math.round((tooltip.valor / total) * 100)}% do total
                    </div>
                )}
            </section>

            <section className="Conteiner4ConteinerProdutoProduto">
                <nav className="produto-menu" aria-label="Ações de produtos">
                    {MODOS.map(({ id, label, icon }) => (
                        <button
                            type="button"
                            key={id}
                            className={`produto-menu-aba${modoProduto === id ? " is-active" : ""}`}
                            aria-pressed={modoProduto === id}
                            onClick={() => selecionarModoProduto(id)}
                        >
                            {createElement(icon)}
                            <span>{label}</span>
                        </button>
                    ))}
                    <span className={`produto-menu-indicador produto-menu-indicador-${modoProduto}`} />
                </nav>
                <div className="Conteiner4ConteinerProdutoProdutoDados">
                    {produtos.length > 0 ? (
                        produtos.map((item, index) => (
                            <CardProduto key={item.id || index} dados={item} />
                        ))
                    ) : (
                        <ProdutoVazio mensagem={mensagensVazias[modoProduto]} />
                    )}
                </div>
            </section>
        </div>
    );
}
