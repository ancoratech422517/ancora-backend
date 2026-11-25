import "./css/Conteiner5WindowConteinerRightGeral.css"

export default function Conteiner5WindowConteinerGeral() {
    return (
        <div className="Conteiner5WindowConteinerRightGeral">
            <div className="Conteiner5WindowConteinerRightDashboard">
                {["Pedidos", "Receita", "Avaliação média"].map((label) => (
                    <div className="Conteiner5WindowConteinerRightDashboardBox" key={label}>
                        <div className="Conteiner5WindowConteinerRightDashboardBoxCaxa2">
                            <b>—</b>
                            <li>{label}</li>
                        </div>
                        <div className="circulo1"></div>
                    </div>
                ))}
            </div>

            <div className="Conteiner5WindowConteinerRightAtividades">
                <h3>Atividades recentes</h3>
                <div className="Conteiner5WindowConteinerRightAtividadesBox">
                    <p>A atividade real da loja aparecerá aqui quando houver pedidos.</p>
                </div>
            </div>

            <div className="Conteiner5WindowConteinerRightMetricasPerformance">
                <h3>Métricas de desempenho</h3>
                <div className="Conteiner5WindowConteinerRightMetricasPerformanceBox">
                    <p>As métricas serão apresentadas após as primeiras vendas.</p>
                </div>
            </div>
        </div>
    )
}
