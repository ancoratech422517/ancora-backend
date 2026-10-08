import { useState, useEffect } from "react";
import "./css/Conteiner4ConteinerProduto.css"
import { Chart as Chartjs } from "chart.js/auto"
import { Bar, Radar, PolarArea } from "react-chartjs-2";
import DataProduto from "./data/DataProduto.json"
import CardProduto from "../conteiner2/Conteiner2RightWindowProdutsCard"
import Cart from "../components/conteinerSvg/cart";
import Erro from "../components/conteinerSvg/erro";
import Editar from "../components/conteinerSvg/editar";
import Mais from "../components/conteinerSvg/mais";
import { Formulario } from "./js/formulario";
import { useUserStore } from "../../useUseSotore";

export default function Conteiner4ConteinerProduto() {
    // Pegando os dados da store
    const { ProdutoUsuario , urlBancoDeDados } = useUserStore();

    // ==================== FORÇA RE-RENDER QUANDO O ARRAY MUDAR ====================
    const [key, setKey] = useState(0);

    useEffect(() => {
        setKey(prev => prev + 1);   // Força re-render sempre que ProdutoUsuario mudar
    }, [ProdutoUsuario]);
    // ====================================================================================

    return (
        <div className="Conteiner4ConteinerProduto">

            <div className="Conteiner4ConteinerProdutoGrafico">
                <Bar className="objectGraficoProduto"
                    data={{
                        labels: DataProduto.map((data) => data.label),
                        datasets: [
                            {
                                label: "revenue",
                                data: DataProduto.map((data) => data.value)
                            }
                        ]
                    }}
                    options={{
                        responsive: true,
                        maintainAspectRatio: false
                    }}
                />
            </div>

            <div className="Conteiner4ConteinerProdutoProduto">
                <div className="Conteiner4ConteinerProdutoProdutoMenuTop">
                    <li>
                        <Cart />
                        <b>Meus produtos</b>
                    </li>
                    <li>
                        <Erro />
                        <b> Eliminar produto</b>
                    </li>
                    <li>
                        <Editar />
                        <b>Editar produto</b>
                    </li>
                    <li onClick={(e)=> Formulario( e , "novo_produto")}>
                        <Mais />
                        <b>Novo produto</b>
                    </li>
                </div>

                <div className="Conteiner4ConteinerProdutoProdutoDados">
                    {Array.isArray(ProdutoUsuario) && ProdutoUsuario.length > 0 ? (
                        ProdutoUsuario.map((item, index) => (
                            <CardProduto 
                                key={item.id || index} 
                                dados={item} 
                            />
                        ))
                    ) : (
                        <p style={{ color: "gray", textAlign: "center", width: "100%", padding: "60px 20px" }}>
                            Você ainda não tem produtos registrados.
                        </p>
                    )}
                </div>
            </div>

        </div>
    )
}