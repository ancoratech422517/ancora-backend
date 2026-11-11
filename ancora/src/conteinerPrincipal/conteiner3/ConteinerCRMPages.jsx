import { useState, useEffect } from "react";
import Ico from "./Icons";
import { api, useList, loadDash, ymd } from "./api";
import { AreaChart, BarChart, kz, short } from "./Charts";
import ArrendamentoProjectModal from "./ArrendamentoProjectModal";

/* [chave, rótulo, tipo (text|number|date|time|sel), extra (opções do select | "kz" | "%")] */
export const CFG = {
  projectos: { t: "Projectos", n: "Novo Projecto", f: [["nome", "Nome"], ["cliente", "Cliente"], ["estado", "Estado", "sel", ["Planeado", "Em curso", "Pausado", "Concluído"]], ["orcamento", "Orçamento", "number", "kz"], ["prazo", "Prazo", "date"], ["progresso", "Progresso", "number", "%"]] },
  clientes: { t: "Clientes", n: "Novo Cliente", f: [["nome", "Nome"], ["email", "Email"], ["telefone", "Telefone"], ["empresa", "Empresa"], ["estado", "Estado", "sel", ["Activo", "Inactivo"]]] },
  financeiro: { t: "Financeiro", n: "Novo Movimento", f: [["descricao", "Descrição"], ["tipo", "Tipo", "sel", ["Receita", "Despesa"]], ["categoria", "Categoria", "sel", ["Vendas", "Parede", "Afiliados", "Ferramentas", "Tráfego Pago"]], ["valor", "Valor", "number", "kz"], ["data", "Data", "date"]] },
  faturas: { t: "Faturas", n: "Nova Fatura", f: [["numero", "Nº"], ["cliente", "Cliente"], ["valor", "Valor", "number", "kz"], ["emissao", "Emissão", "date"], ["vencimento", "Vencimento", "date"], ["estado", "Estado", "sel", ["Pendente", "Paga", "Atrasada"]]] },
  turmas: { t: "Turmas", n: "Nova Turma", f: [["nome", "Nome"], ["formador", "Formador"], ["alunos", "Alunos", "number"], ["horario", "Horário"], ["inicio", "Início", "date"], ["estado", "Estado", "sel", ["Planeada", "Em curso", "Concluída"]]] },
  calendario: { t: "Calendário", n: "Novo Evento", f: [["titulo", "Título"], ["data", "Data", "date"], ["hora", "Hora", "time"], ["tipo", "Tipo", "sel", ["Reunião", "Aula", "Entrega", "Pagamento"]]] },
};
const slug = v => String(v).normalize("NFD").replace(/[^\w]/g, "").toLowerCase();
const show = ([k, , t, x], v) => x === "kz" ? kz(v) : x === "%" ? v + "%" : t === "date" && v ? v.split("-").reverse().join("/") : k === "estado" || k === "tipo" ? <span className={"bd " + slug(v)}>{v}</span> : v;
const Shell = ({ children }) => <div className="ConteinerMenuRightCRMDashboard crmPage">{children}</div>;

function FormModal({ f, init, titulo, onSave, onDel, onClose }) {
  const [v, setV] = useState(() => ({ ...Object.fromEntries(f.filter(a => a[2] === "sel").map(a => [a[0], a[3][0]])), ...init }));
  const [err, setErr] = useState("");
  const submit = async e => {
    e.preventDefault();
    const d = { ...v }; f.forEach(([k, , t]) => { if (t === "number") d[k] = Number(d[k]) || 0; });
    try { await onSave(d); onClose(); } catch (x) { setErr(x.message); }
  };
  return (
    <div className="crmModal" onClick={onClose}>
      <form className="crmCard" onClick={e => e.stopPropagation()} onSubmit={submit}>
        <h3>{titulo}</h3>
        {f.map(([k, l, t = "text", x]) => (
          <label key={k}>{l}
            {t === "sel"
              ? <select value={v[k]} onChange={e => setV({ ...v, [k]: e.target.value })}>{x.map(o => <option key={o}>{o}</option>)}</select>
              : <input required type={t} value={v[k] ?? ""} onChange={e => setV({ ...v, [k]: e.target.value })} />}
          </label>
        ))}
        {err && <p className="crmErr">{err}</p>}
        <div className="crmRow">
          {init.id && onDel && <button type="button" className="crmBtn ghost" onClick={async () => { try { await onDel(); onClose(); } catch (x) { setErr(x.message); } }}>Eliminar</button>}
          <button type="button" className="crmBtn ghost" onClick={onClose}>Cancelar</button>
          <button className="crmBtn">Guardar</button>
        </div>
      </form>
    </div>
  );
}

/* Listagem e CRUD sempre no backend Flask. */
export function DataPage({ res, novo = 0 }) {
  const c = CFG[res], { rows, load, error, reload } = useList(res), [q, setQ] = useState(""), [m, setM] = useState(null);
  const [mostrarArrendamento, setMostrarArrendamento] = useState(false);
  useEffect(() => { if (novo) setM({}); }, [novo]);
  const lista = rows.filter(r => JSON.stringify(r).toLowerCase().includes(q.toLowerCase()));
  const del = async r => { if (window.confirm("Eliminar este registo?")) { await api.remove(res, r.id); await reload(); } };
  return (
    <Shell>
      <div className="pgHead"><h2>{c.t}</h2>
        <div className="crmRow"><input placeholder="Pesquisar…" value={q} onChange={e => setQ(e.target.value)} />
          {res === "projectos" && <button type="button" className="crmBtn ghost" onClick={() => setMostrarArrendamento(true)}>Registar arrendamento</button>}
          <button className="crmBtn" onClick={() => setM({})}><Ico n="plus" />{c.n}</button></div></div>
      {error && <p className="crmErr" role="alert">{error} <button type="button" className="crmBtn ghost" onClick={() => void reload().catch(() => {})}>Tentar novamente</button></p>}
      <div className="crmCard tbl"><table>
        <thead><tr>{c.f.map(a => <th key={a[0]}>{a[1]}</th>)}<th /></tr></thead>
        <tbody>
          {lista.map(r => <tr key={r.id}>{c.f.map(a => <td key={a[0]} data-label={a[1]}>{show(a, r[a[0]])}</td>)}
            <td className="acts"><button onClick={() => setM(r)}><Ico n="edit" /></button><button onClick={() => del(r)}><Ico n="trash" /></button></td></tr>)}
          {!lista.length && <tr><td colSpan={c.f.length + 1}>{load ? "A carregar…" : "Sem registos."}</td></tr>}
        </tbody></table></div>
      {m && <FormModal f={c.f} init={m} titulo={m.id ? "Editar " + c.t : c.n} onClose={() => setM(null)}
        onSave={d => (m.id ? api.update(res, m.id, d) : api.create(res, d)).then(reload)} />}
      {mostrarArrendamento && <ArrendamentoProjectModal onClose={() => setMostrarArrendamento(false)} onRegistered={() => reload().catch(() => {})} />}
    </Shell>
  );
}

export function Calendario() {
  const c = CFG.calendario, { rows, error, reload } = useList("calendario"), [m, setM] = useState(null), [sel, setSel] = useState(() => ymd(new Date()));
  const [ref, setRef] = useState(() => { const d = new Date(); d.setDate(1); return d; });
  const y = ref.getFullYear(), mo = ref.getMonth(), n = new Date(y, mo + 1, 0).getDate();
  const cells = [...Array(ref.getDay()).fill(null), ...Array.from({ length: n }, (_, i) => i + 1)];
  const dia = d => `${y}-${String(mo + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  return (
    <Shell>
      <div className="pgHead"><h2>{ref.toLocaleDateString("pt-PT", { month: "long", year: "numeric" })}</h2>
        <div className="crmRow"><button className="crmBtn ghost" onClick={() => setRef(new Date(y, mo - 1, 1))}>‹</button><button className="crmBtn ghost" onClick={() => setRef(new Date(y, mo + 1, 1))}>›</button>
          <button className="crmBtn" onClick={() => setM({ data: sel })}><Ico n="plus" />{c.n}</button></div></div>
      {error && <p className="crmErr" role="alert">{error} <button type="button" className="crmBtn ghost" onClick={() => void reload().catch(() => {})}>Tentar novamente</button></p>}
      <div className="crmCard calGrid">
        {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map(d => <b key={d}>{d}</b>)}
        {cells.map((d, i) => <div key={i} className={"calDia" + (d ? "" : " vazio") + (d && dia(d) === sel ? " sel" : "")} onClick={() => d && setSel(dia(d))}>
          {d && <span>{d}</span>}
          {d && rows.filter(e => e.data === dia(d)).map(e => <em key={e.id} className={"bd " + slug(e.tipo)} onClick={x => { x.stopPropagation(); setM(e); }}>{e.hora} {e.titulo}</em>)}
        </div>)}
      </div>
      <div className="crmCard">
        <div className="crmRow" style={{ justifyContent: "space-between", marginBottom: 8 }}><h3>{sel.split("-").reverse().join("/")}</h3><button className="crmBtn" onClick={() => setM({ data: sel })}><Ico n="plus" />{c.n}</button></div>
        {rows.filter(e => e.data === sel).sort((a, b) => (a.hora || "").localeCompare(b.hora || "")).map(e => <div className="evItem" key={e.id} style={{ cursor: "pointer" }} onClick={() => setM(e)}><b>{e.hora}</b><span>{e.titulo}</span><em className={"bd " + slug(e.tipo)} style={{ marginLeft: "auto" }}>{e.tipo}</em></div>)}
        {!rows.some(e => e.data === sel) && <p>Sem eventos neste dia.</p>}
      </div>
      {m && <FormModal f={c.f} init={m} titulo={m.id ? "Editar evento" : c.n} onClose={() => setM(null)}
        onSave={d => (m.id ? api.update("calendario", m.id, d) : api.create("calendario", d)).then(reload)}
        onDel={() => api.remove("calendario", m.id).then(reload)} />}
    </Shell>
  );
}

export function Relatorios() {
  const [d, setD] = useState(null), [error, setError] = useState(""), [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let active = true;
    loadDash()
      .then(data => { if (active) { setD(data); setError(""); } })
      .catch(requestError => { if (active) setError(requestError.message || "Não foi possível carregar os relatórios."); });
    return () => { active = false; };
  }, [attempt]);
  const csv = async r => {
    const l = await api.list(r), ks = CFG[r].f.map(a => a[0]), a = document.createElement("a");
    const t = [ks.join(";"), ...l.map(x => ks.map(k => `"${String(x[k] ?? "").replace(/"/g, '""')}"`).join(";"))].join("\n");
    a.href = URL.createObjectURL(new Blob(["\ufeff" + t], { type: "text/csv" })); a.download = `ancora-${r}.csv`; a.click();
  };
  if (error && !d) return <Shell><p className="crmErr" role="alert">{error}</p><button className="crmBtn" onClick={() => { setError(""); setAttempt(value => value + 1); }}>Tentar novamente</button></Shell>;
  if (!d) return <Shell>A carregar…</Shell>;
  return (
    <Shell>
      <div className="pgHead"><h2>Relatórios</h2></div>
      <div className="relGrid">
        <div className="crmCard chartBox"><h3>Receitas vs Despesas (6 meses)</h3><AreaChart id="rel-receitas-despesas" data={d.serie} /></div>
        <div className="crmCard chartBox"><h3>Gastos por Categoria</h3><BarChart id="rel-categorias" data={d.cats} fmt={short} /></div>
      </div>
      <div className="crmCard"><h3>Exportar dados (CSV)</h3><br />
        <div className="crmRow">{["projectos", "clientes", "financeiro", "faturas", "turmas"].map(r => <button key={r} className="crmBtn ghost" onClick={() => csv(r)}><Ico n="download" />{CFG[r].t}</button>)}</div></div>
    </Shell>
  );
}
