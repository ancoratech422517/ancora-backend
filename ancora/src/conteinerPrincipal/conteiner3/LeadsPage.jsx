import { useMemo, useState } from "react";
import { api, useList } from "./api";
import Ico from "./Icons";
import "./css/Anuncios.css";

function formatLeadDate(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString("pt-PT");
}

export default function LeadsPage() {
  const { rows, load, error, reload } = useList("leads");
  const [search, setSearch] = useState("");
  const [actionError, setActionError] = useState("");
  const leads = useMemo(() => {
    const term = search.trim().toLowerCase();
    return [...rows]
      .reverse()
      .filter((lead) => !term || JSON.stringify(lead).toLowerCase().includes(term));
  }, [rows, search]);

  async function deleteLead(lead) {
    if (!window.confirm(`Eliminar o lead de "${lead.nome}"?`)) return;
    setActionError("");
    try {
      await api.remove("leads", lead.id);
      await reload();
    } catch (requestError) {
      setActionError(requestError.message || "Não foi possível eliminar o lead.");
    }
  }

  return (
    <div className="ConteinerMenuRightCRMDashboard crmPage adsLeadsPage">
      <div className="pgHead">
        <div>
          <h2>Leads de anúncios</h2>
          <p>Interesses enviados pelos visitantes das suas páginas públicas.</p>
        </div>
        <div className="crmRow">
          <input
            type="search"
            placeholder="Pesquisar leads…"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            aria-label="Pesquisar leads"
          />
          <button type="button" className="crmBtn ghost" onClick={() => void reload().catch(() => {})}>
            Atualizar
          </button>
        </div>
      </div>
      {(error || actionError) && (
        <p className="crmErr" role="alert">
          {actionError || error}
          {error && !actionError && (
            <button type="button" className="crmBtn ghost" onClick={() => void reload().catch(() => {})}>
              Tentar novamente
            </button>
          )}
        </p>
      )}
      <div className="crmCard tbl">
        <table>
          <thead>
            <tr>
              <th>Nome</th>
              <th>WhatsApp</th>
              <th>Email</th>
              <th>Anúncio</th>
              <th>Recebido em</th>
              <th>Estado</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {leads.map((lead) => (
              <tr key={lead.id}>
                <td data-label="Nome">{lead.nome}</td>
                <td data-label="WhatsApp">
                  <a href={`https://wa.me/${lead.telefone}`} target="_blank" rel="noreferrer">
                    {lead.telefone}
                  </a>
                </td>
                <td data-label="Email">{lead.email || "—"}</td>
                <td data-label="Anúncio">{lead.anuncio}</td>
                <td data-label="Recebido em">{formatLeadDate(lead.criado_em)}</td>
                <td data-label="Estado"><span className="bd pendente">{lead.estado}</span></td>
                <td className="acts">
                  <button type="button" aria-label={`Eliminar lead de ${lead.nome}`} onClick={() => void deleteLead(lead)}>
                    <Ico n="trash" />
                  </button>
                </td>
              </tr>
            ))}
            {!leads.length && (
              <tr>
                <td colSpan={7}>{load ? "A carregar leads…" : "Ainda não há leads registados."}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <p className="adsLeadsCount">{leads.length} {leads.length === 1 ? "lead" : "leads"}</p>
    </div>
  );
}
