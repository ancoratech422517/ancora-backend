import "./css/Conteiner4RightWindowBoxCenter.css";
import Cart from "../components/conteinerSvg/cart";
import Vendido from "../components/conteinerSvg/vendido";
import Quantidade from "../components/conteinerSvg/quantidade";

const formatarQuantidade = (value) => new Intl.NumberFormat("pt-AO").format(Number(value) || 0);

export default function Conteiner4RightWindowBoxCenter({ dashboard }) {
    const maisPedido = dashboard?.produto_mais_pedido;
    const cards = [
        {
            titulo: "Minha loja",
            Icone: Cart,
            dados: [
                ["Produtos publicados", formatarQuantidade(dashboard?.produtos)],
                ["Favoritos", formatarQuantidade(dashboard?.favoritos)],
            ],
        },
        {
            titulo: "Pedidos recebidos",
            Icone: Vendido,
            dados: [
                ["Total", formatarQuantidade(dashboard?.pedidos)],
                ["Pendentes", formatarQuantidade(dashboard?.pedidos_pendentes)],
            ],
        },
        {
            titulo: "Clientes",
            Icone: Quantidade,
            dados: [
                ["Clientes únicos", formatarQuantidade(dashboard?.clientes)],
                ["Recorrentes", formatarQuantidade(dashboard?.clientes_recorrentes)],
            ],
        },
        {
            titulo: "Mais encomendado",
            Icone: Vendido,
            dados: [
                ["Produto", maisPedido?.nome || "Sem pedidos"],
                ["Pedidos", formatarQuantidade(maisPedido?.pedidos)],
            ],
        },
    ];

    return (
        <div className="Conteiner4RightWindowBoxCenter">
            {cards.map(({ titulo, Icone, dados }) => (
                <article className="Conteiner4RightWindowBoxCenterBoxGrafico" key={titulo}>
                    <div className="Conteiner4RightWindowBoxCenterGraficoCaxa dashboard-stat-heading">
                        <div className="Conteiner4RightWindowBoxCenterGraficoCaxaIcone"><Icone /></div>
                        <h3>{titulo}</h3>
                    </div>
                    {dados.map(([label, value]) => (
                        <div className="Conteiner4RightWindowBoxCenterGraficoCaxa dashboard-stat-row" key={label}>
                            <b>{label}:</b>
                            <p className="dashboard-stat-value" title={value}>{value}</p>
                        </div>
                    ))}
                </article>
            ))}
        </div>
    );
}
