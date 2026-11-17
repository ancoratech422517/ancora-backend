import { useMemo, useState } from "react";
import "./css/Conteiner4ConteinerAfiliado.css";
import Conteiner4ConteinerAfiliadoDados from "./Conteiner4ConteinerAfiliadoDados";
import useLojaDashboard from "./useLojaDashboard";

const EMPTY_AFFILIATES = [];

export default function Conteiner4ConteinerAfifliado() {
    const { dashboard, loading, error, refresh } = useLojaDashboard();
    const [estadoCopiar, setEstadoCopiar] = useState("");
    const afiliados = dashboard?.afiliados || EMPTY_AFFILIATES;
    const linkConvite = useMemo(() => {
        if (!dashboard?.codigo_convite || typeof window === "undefined") return "";
        const url = new URL("/", window.location.origin);
        url.searchParams.set("convite", dashboard.codigo_convite);
        return url.toString();
    }, [dashboard?.codigo_convite]);

    const copiarLinkConvite = async () => {
        if (!linkConvite) return;
        try {
            await navigator.clipboard.writeText(linkConvite);
            setEstadoCopiar("copiado");
            window.setTimeout(() => setEstadoCopiar(""), 2200);
        } catch {
            setEstadoCopiar("erro");
            window.setTimeout(() => setEstadoCopiar(""), 3000);
        }
    };

    return (
        <div className="Conteiner4ConteinerAfiliado">
            <section className="afiliados-grafico afiliados-resumo" aria-label="Resumo de afiliados da conta">
                <div className="afiliados-grafico-legenda"><i aria-hidden="true" />Afiliados associados à conta</div>
                {!dashboard && (
                    <div className="afiliados-estado" role={error ? "alert" : "status"}>
                        <span>{loading ? "A carregar os dados…" : error || "Não foi possível carregar os dados."}</span>
                        {!loading && <button type="button" onClick={() => void refresh()}>Tentar novamente</button>}
                    </div>
                )}
                {dashboard && (
                    <>
                        <strong className="afiliados-resumo-total">{dashboard.afiliados_total}</strong>
                        <p>Contas que se registaram com o teu convite.</p>
                        <div className="afiliados-convite">
                            <span>O teu código</span>
                            <code>{dashboard.codigo_convite}</code>
                            <input aria-label="Link de convite" readOnly value={linkConvite} onFocus={(event) => event.currentTarget.select()} />
                            <button type="button" onClick={copiarLinkConvite}>
                                {estadoCopiar === "copiado"
                                    ? "Link copiado"
                                    : estadoCopiar === "erro"
                                        ? "Seleciona e copia o link acima"
                                        : "Copiar link de convite"}
                            </button>
                        </div>
                    </>
                )}
            </section>
            <section className="afiliados-lista" aria-label="Lista de afiliados">
                {afiliados.map((afiliado, index) => (
                    <Conteiner4ConteinerAfiliadoDados
                        key={afiliado.id}
                        nome={afiliado.nome || "Afiliado"}
                        foto={afiliado.foto}
                        descricao={afiliado.data_registro
                            ? `Registado em ${new Intl.DateTimeFormat("pt-AO", { dateStyle: "medium" }).format(new Date(afiliado.data_registro))}`
                            : "Registado através do teu convite"}
                        atraso={index}
                    />
                ))}
                {dashboard && afiliados.length === 0 && (
                    <p className="afiliados-lista-vazia">
                        Partilha o teu link para aparecerem aqui as contas registadas pelo convite.
                    </p>
                )}
            </section>
        </div>
    );
}
