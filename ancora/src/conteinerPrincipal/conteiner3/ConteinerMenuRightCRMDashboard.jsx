import { useState, useEffect } from "react";
import "./css/ConteinerMenuRightCRMDashboard.css";
import Ico from "./Icons";
import { api, loadDash, ymd } from "./api";
import { AreaChart, BarChart, Donut, kz } from "./Charts";

const C = "ConteinerMenuRightCRMDashboard";
export default function ConteinerMenuRightCRMDashboard() {
    const [d, setD] = useState(null), [ev, setEv] = useState([]), [error, setError] = useState(""), [attempt, setAttempt] = useState(0);
    useEffect(() => {
        let active = true;
        Promise.all([loadDash(), api.list("calendario")])
            .then(([dashboard, calendar]) => {
                if (!active) return;
                setD(dashboard);
                setEv(calendar.filter(e => e.data >= ymd(new Date())).sort((a, b) => (a.data + (a.hora || "")).localeCompare(b.data + (b.hora || ""))).slice(0, 5));
                setError("");
            })
            .catch(requestError => {
                if (active) setError(requestError.message || "Não foi possível carregar o dashboard.");
            });
        return () => { active = false; };
    }, [attempt]);
    if (error && !d) return <div className={C}><p className="crmErr" role="alert">{error}</p><button className="crmBtn" onClick={() => { setError(""); setAttempt(value => value + 1); }}>Tentar novamente</button></div>;
    if (!d) return <div className={C}>A carregar…</div>;
    const { kpi: k, serie, cats, projEstado, fatEstado } = d, total = cats.reduce((s, x) => s + x.valor, 0) || 1;
    const sg = n => (n >= 0 ? "+" : "") + n + "% este mes";
    const KPI = [
        ["Saldo Actual", "dollar", kz(k.saldo), sg(k.dRec)],
        ["Recebido", "up", kz(k.recebido), sg(k.dRec)],
        ["Gastos", "down", kz(k.gastos), sg(k.dGas), k.dGas > 0],
        ["Projectos Ativos", "briefcase", k.activos, k.totalProj + " Totais"],
        ["Faturas Pendente", "faturas", kz(k.pendente), k.nPend + " em aberto", k.nPend > 0],
    ];
    return (
        <div className={C}>
            <div className={C + "BoxTop"}>
                {KPI.map(([t, ic, v, s, bad]) => (
                    <div className={C + "BoxTopCaxa"} key={t}>
                        <div><li>{t}</li><p><Ico n={ic} /></p></div>
                        <h2>{v}</h2>
                        <ul className={bad ? "bad" : ""}><Ico n="arrow" /><span>{s}</span></ul>
                    </div>
                ))}
            </div>
            <div className={C + "BoxCenter"}>
                <div className={C + "BoxCenterBox1 chartBox"}>
                    <h3>Receitas vs Despesas <small><i style={{ background: "#0d9488" }} />Receitas <i style={{ background: "#f59e0b" }} />Despesas</small></h3>
                    <AreaChart id="receitas-despesas" data={serie} />
                </div>
                <div className={C + "BoxCenterBox2"}>
                    <div className={C + "BoxCenterBox2Box1"}><Ico n="pie" /><h3>Gastos por Categoria</h3></div>
                    {cats.slice(0, 4).map(c => { const p = Math.round(c.valor / total * 100); return (
                        <div className={C + "BoxCenterBox2Box2"} key={c.nome}>
                            <div className={C + "BoxCenterBox2Box2Conteudo"}><li>{c.nome}</li><b>{p}% - {kz(c.valor)}</b></div>
                            <div className={C + "BoxCenterBox2Box2Progresso"}><div className={C + "BoxCenterBox2Box2ProgressoDados1"} style={{ width: p + "%" }} /></div>
                        </div>); })}
                </div>
            </div>
            <div className={C + "BoxBottom"}>
                <div className={C + "BoxBottomBoxLeft"}>
                    <div className={C + "BoxBottomBoxLeftBox1 chartBox"}><h3>Projectos por Estado</h3><BarChart id="projectos-estado" data={projEstado} /></div>
                    <div className={C + "BoxBottomBoxLeftBox2 chartBox"}><h3>Faturas por Estado</h3><Donut id="faturas-estado" data={fatEstado} /></div>
                </div>
                <div className={C + "BoxBottomRight chartBox"}>
                    <h3>Próximos Eventos</h3>
                    {ev.length ? ev.map(e => <div className="evItem" key={e.id}><b>{e.data.slice(8)}/{e.data.slice(5, 7)}</b><span>{e.titulo}</span><small>{e.hora}</small></div>) : <p>Sem eventos.</p>}
                </div>
            </div>
        </div>
    );
}
