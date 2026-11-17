import "./css/Conteiner3ConteinerDashboard.css";
import Conteiner4RightWindowBoxCenter from "./Conteiner4RightWindwBoxCenter";
import Conteiner4WindowGrafico from "./Conteiner4WindowGrafico";
import useLojaDashboard from "./useLojaDashboard";

export default function Conteiner4ConteinerDashboard() {
    const { dashboard, loading, error, refresh } = useLojaDashboard();

    if (!dashboard) {
        return (
            <div className="Conteiner3ConteinerDashboard dashboard-data-state" role={error ? "alert" : "status"}>
                <p>{loading ? "A carregar os dados reais da tua loja…" : error || "Não há dados disponíveis."}</p>
                {!loading && <button type="button" onClick={() => void refresh()}>Tentar novamente</button>}
            </div>
        );
    }

    return (
        <div className="Conteiner3ConteinerDashboard">
            {error && (
                <div className="dashboard-refresh-error" role="status">
                    <span>Não foi possível actualizar os dados agora: {error}</span>
                    <button type="button" onClick={() => void refresh()}>Tentar novamente</button>
                </div>
            )}
            <Conteiner4RightWindowBoxCenter dashboard={dashboard} />
            <Conteiner4WindowGrafico dashboard={dashboard} />
        </div>
    );
}
