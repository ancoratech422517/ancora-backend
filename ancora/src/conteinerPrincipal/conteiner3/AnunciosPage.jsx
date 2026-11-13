import { useEffect, useMemo, useState } from "react";
import { fetchComAuth } from "../../utils/api";
import { useUserStore } from "../../useUseSotore";
import CachedImage from "../../components/CachedImage";
import { api, useList } from "./api";
import Ico from "./Icons";
import "./css/Anuncios.css";

const initialForm = (owner = "") => ({
  origem_tipo: "produto",
  origem_id: "",
  preco: "",
  badge: "NOVO",
  descCurta: "",
  descLonga: "",
  beneficios: "",
  proprietario: owner,
  whatsapp: "",
});

function getImageUrl(image, backend) {
  if (!image) return "";
  if (/^(https?:|data:|blob:)/i.test(image)) return image;
  return `${String(backend || "").replace(/\/+$/, "")}/${String(image).replace(/^\/+/, "")}`;
}

function AnalyticsChart({ series }) {
  const width = 760;
  const height = 220;
  const left = 34;
  const right = 12;
  const top = 14;
  const bottom = 28;
  const plotWidth = width - left - right;
  const plotHeight = height - top - bottom;
  const maximum = Math.max(
    1,
    ...series.flatMap((item) => [item.visualizacoes, item.cliques, item.leads]),
  );
  const x = (index) => left + (series.length > 1 ? index / (series.length - 1) : 0.5) * plotWidth;
  const y = (value) => top + (1 - value / maximum) * plotHeight;
  const lines = [
    ["visualizacoes", "adsChartViews"],
    ["cliques", "adsChartClicks"],
    ["leads", "adsChartLeads"],
  ];
  const ticks = [...new Set([0, .25, .5, .75, 1].map((fraction) => Math.round((series.length - 1) * fraction)))];

  return (
    <div className="adsChartWrap">
      <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Visualizações, cliques e leads ao longo do período">
        <title>Visualizações, cliques e leads por dia</title>
        {[0, .5, 1].map((fraction) => {
          const value = Math.round(maximum * fraction);
          const position = y(value);
          return (
            <g key={fraction}>
              <line x1={left} x2={width - right} y1={position} y2={position} className="adsChartGrid" />
              <text x={left - 8} y={position + 4} textAnchor="end" className="adsChartAxis">{value}</text>
            </g>
          );
        })}
        {lines.map(([field, className]) => (
          <polyline
            key={field}
            className={className}
            points={series.map((item, index) => `${x(index)},${y(item[field])}`).join(" ")}
          />
        ))}
      </svg>
      <div className="adsChartDates">
        {ticks.map((index) => (
          <span key={index}>
            {new Date(`${series[index].data}T00:00:00`).toLocaleDateString("pt-PT", { day: "2-digit", month: "2-digit" })}
          </span>
        ))}
      </div>
      <div className="adsChartLegend">
        <span className="adsLegendViews">Visualizações</span>
        <span className="adsLegendClicks">Cliques</span>
        <span className="adsLegendLeads">Leads</span>
      </div>
    </div>
  );
}

export default function AnunciosPage() {
  const user = useUserStore((state) => state.dadosUsuario);
  const backend = useUserStore((state) => state.urlBancoDeDados);
  const { rows, load, error: adsError, reload } = useList("anuncios");
  const [produtos, setProdutos] = useState([]);
  const [cursos, setCursos] = useState([]);
  const [sourcesLoading, setSourcesLoading] = useState(true);
  const [sourcesError, setSourcesError] = useState("");
  const [form, setForm] = useState(() => initialForm(user?.nome || ""));
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [generatedLink, setGeneratedLink] = useState("");
  const [copyStatus, setCopyStatus] = useState("");
  const [period, setPeriod] = useState("30d");
  const [metricsRefresh, setMetricsRefresh] = useState(0);
  const [metricsResult, setMetricsResult] = useState(null);

  useEffect(() => {
    let active = true;
    async function loadSources() {
      if (!user?.id) {
        setSourcesLoading(false);
        setSourcesError("Não foi possível identificar a sua conta.");
        return;
      }
      setSourcesLoading(true);
      setSourcesError("");
      try {
        const [productsResponse, coursesResponse] = await Promise.all([
          fetchComAuth(`${backend}/buscar_produto_usuario/${user.id}`),
          fetchComAuth(`${backend}/buscar_turma_usuario/${user.id}`),
        ]);
        if (!productsResponse.ok || !coursesResponse.ok) {
          throw new Error("Não foi possível carregar os seus produtos e cursos.");
        }
        const [productRows, courseRows] = await Promise.all([
          productsResponse.json(),
          coursesResponse.json(),
        ]);
        if (!Array.isArray(productRows) || !Array.isArray(courseRows)) {
          throw new Error("O servidor devolveu uma lista inválida de produtos ou cursos.");
        }
        if (!active) return;
        setProdutos(productRows.filter((item) => item?.id != null));
        setCursos(courseRows.filter(
          (item) =>
            item?.id != null &&
            String(item.id_admin_Turma) === String(user.id) &&
            item.tipo_usuario_Turma === "admin",
        ));
      } catch (requestError) {
        if (active) setSourcesError(requestError.message || "Não foi possível carregar os seus produtos e cursos.");
      } finally {
        if (active) setSourcesLoading(false);
      }
    }
    void loadSources();
    return () => {
      active = false;
    };
  }, [backend, user?.id]);

  useEffect(() => {
    let active = true;
    api.adMetrics(period)
      .then((data) => {
        if (active) setMetricsResult({ period, refresh: metricsRefresh, data, error: "" });
      })
      .catch((requestError) => {
        if (active) {
          setMetricsResult({
            period,
            refresh: metricsRefresh,
            data: null,
            error: requestError.message || "Não foi possível carregar as métricas dos anúncios.",
          });
        }
      });
    return () => {
      active = false;
    };
  }, [period, metricsRefresh]);

  const currentMetrics = metricsResult?.period === period && metricsResult?.refresh === metricsRefresh
    ? metricsResult
    : null;
  const metrics = currentMetrics?.data;
  const metricsLoading = !currentMetrics;
  const metricsError = currentMetrics?.error || "";
  const metricsByAd = useMemo(
    () => new Map((metrics?.anuncios || []).map((item) => [String(item.id), item])),
    [metrics],
  );

  const sources = form.origem_tipo === "produto" ? produtos : cursos;
  const selectedSource = useMemo(
    () => sources.find((item) => String(item.id) === String(form.origem_id)),
    [sources, form.origem_id],
  );
  const title = form.origem_tipo === "produto"
    ? selectedSource?.nome_produto || ""
    : selectedSource?.nome_Turma || "";
  const category = form.origem_tipo === "produto"
    ? selectedSource?.tipo_produto || ""
    : selectedSource ? "Cursos" : "";
  const image = form.origem_tipo === "produto"
    ? selectedSource?.url_imagem_produto || ""
    : selectedSource?.imagem_perfil_Turma || "";
  const imageBlurHash = form.origem_tipo === "produto"
    ? selectedSource?.url_imagem_produto_blurhash
    : selectedSource?.imagem_perfil_Turma_blurhash;
  const price = form.origem_tipo === "produto"
    ? selectedSource?.preco_produto || ""
    : form.preco;
  const imageUrl = getImageUrl(image, backend);

  function changeField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
    setFormError("");
  }

  function chooseSourceType(value) {
    setForm((current) => ({ ...current, origem_tipo: value, origem_id: "", preco: "" }));
    setFormError("");
  }

  function chooseSource(value) {
    const source = sources.find((item) => String(item.id) === value);
    setForm((current) => ({
      ...current,
      origem_id: value,
      preco: current.origem_tipo === "produto"
        ? source?.preco_produto || ""
        : current.preco,
      descCurta: current.descCurta || (
        current.origem_tipo === "produto" ? source?.descricao_produto || "" : ""
      ),
    }));
    setFormError("");
  }

  function startNew() {
    setEditingId(null);
    setForm(initialForm(user?.nome || ""));
    setFormError("");
    setGeneratedLink("");
    setCopyStatus("");
  }

  function editAdvertisement(ad) {
    setEditingId(ad.id);
    setForm({
      origem_tipo: ad.origem_tipo,
      origem_id: String(ad.origem_id),
      preco: ad.preco || "",
      badge: ad.badge || "NOVO",
      descCurta: ad.descCurta || "",
      descLonga: ad.descLonga || "",
      beneficios: ad.beneficios || "",
      proprietario: ad.proprietario || "",
      whatsapp: ad.whatsapp || "",
    });
    setFormError("");
    setGeneratedLink("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function saveAdvertisement(event) {
    event.preventDefault();
    if (!selectedSource) {
      setFormError(`Selecione um ${form.origem_tipo === "produto" ? "produto" : "curso"} registado na sua conta.`);
      return;
    }
    if (!image) {
      setFormError("O registo selecionado não tem uma imagem associada.");
      return;
    }
    if (!price.trim()) {
      setFormError(form.origem_tipo === "curso" ? "Indique o preço do curso." : "O produto não tem um preço registado.");
      return;
    }

    setSaving(true);
    setFormError("");
    try {
      const payload = {
        origem_tipo: form.origem_tipo,
        origem_id: Number(form.origem_id),
        preco: form.preco,
        badge: form.badge,
        descCurta: form.descCurta,
        descLonga: form.descLonga,
        beneficios: form.beneficios,
        proprietario: form.proprietario,
        whatsapp: form.whatsapp,
      };
      const saved = editingId
        ? await api.update("anuncios", editingId, payload)
        : await api.create("anuncios", payload);
      await reload();
      setMetricsRefresh((value) => value + 1);
      const link = api.publicAdShareUrl(saved.id);
      setGeneratedLink(link);
      setEditingId(null);
      setForm(initialForm(user?.nome || ""));
      setCopyStatus("");
    } catch (saveError) {
      setFormError(saveError.message || "Não foi possível guardar o anúncio.");
    } finally {
      setSaving(false);
    }
  }

  async function copyLink(link) {
    try {
      await navigator.clipboard.writeText(link);
      setCopyStatus("Link copiado.");
    } catch (copyError) {
      setCopyStatus("Não foi possível copiar o link. Copie-o manualmente.");
      console.error("Falha ao copiar o link do anúncio:", copyError);
    }
  }

  async function deleteAdvertisement(ad) {
    if (!window.confirm(`Eliminar o anúncio "${ad.title}"?`)) return;
    try {
      await api.remove("anuncios", ad.id);
      await reload();
      setMetricsRefresh((value) => value + 1);
    } catch (deleteError) {
      setFormError(deleteError.message || "Não foi possível eliminar o anúncio.");
    }
  }

  function refreshAnalytics() {
    void reload().catch(() => {});
    setMetricsRefresh((value) => value + 1);
  }

  return (
    <div className="ConteinerMenuRightCRMDashboard crmPage ancoraAds">
      <div className="pgHead adsPageHead">
        <div>
          <h2>Gerador de anúncios</h2>
          <p>Crie cards profissionais para os seus produtos e cursos.</p>
        </div>
        <button type="button" className="crmBtn" onClick={startNew}>
          <Ico n="plus" /> Novo anúncio
        </button>
      </div>

      <div className="adsWorkspace">
        <form className="crmCard adsForm" onSubmit={saveAdvertisement}>
          <div className="adsFormTitle">
            <h3>{editingId ? "Editar anúncio" : "Criar anúncio profissional"}</h3>
            <p>Selecione um registo da sua conta; título, categoria e imagem são preenchidos automaticamente.</p>
          </div>
          <div className="adsFields">
            <label>
              Tipo de anúncio
              <select value={form.origem_tipo} onChange={(event) => chooseSourceType(event.target.value)}>
                <option value="produto">Produto</option>
                <option value="curso">Curso</option>
              </select>
            </label>
            <label>
              {form.origem_tipo === "produto" ? "Produto registado" : "Curso / turma registado"}
              <select
                required
                value={form.origem_id}
                onChange={(event) => chooseSource(event.target.value)}
                disabled={sourcesLoading || Boolean(sourcesError)}
              >
                <option value="">
                  {sourcesLoading ? "A carregar registos…" : "Selecione um registo"}
                </option>
                {sources.map((item) => {
                  const id = String(item.id);
                  return (
                    <option key={id} value={id}>
                      {form.origem_tipo === "produto" ? item.nome_produto : item.nome_Turma}
                    </option>
                  );
                })}
              </select>
            </label>
            {sourcesError && <p className="crmErr adsFullWidth" role="alert">{sourcesError}</p>}
            {!sourcesLoading && !sourcesError && sources.length === 0 && (
              <p className="adsHint adsFullWidth">
                Ainda não há {form.origem_tipo === "produto" ? "produtos" : "cursos/turmas"} registados nesta conta.
              </p>
            )}
            <div className="adsSelectedPreview adsFullWidth">
              <div className="adsSelectedImage">
                {imageUrl
                  ? <CachedImage src={imageUrl} blurHash={imageBlurHash} alt={`Imagem de ${title}`} />
                  : <span>A imagem do registo selecionado aparecerá aqui</span>}
              </div>
              <div>
                <span className="adsFieldHint">Origem e imagem do anúncio</span>
                <strong>{title || "Nenhum registo selecionado"}</strong>
                <span>{category || "A categoria será preenchida automaticamente"}</span>
              </div>
            </div>
            <label>
              Preço
              <input
                required
                value={price}
                onChange={(event) => changeField("preco", event.target.value)}
                placeholder="Ex.: 25.000 Kz"
                readOnly={form.origem_tipo === "produto"}
              />
            </label>
            <label>
              Destaque
              <input
                value={form.badge}
                onChange={(event) => changeField("badge", event.target.value)}
                placeholder="NOVO, PROMO"
                maxLength={40}
              />
            </label>
            <label className="adsFullWidth">
              Descrição curta do card
              <input
                value={form.descCurta}
                onChange={(event) => changeField("descCurta", event.target.value)}
                placeholder="Resumo que aparecerá no card"
                maxLength={255}
              />
            </label>
            <label className="adsFullWidth">
              Descrição completa
              <textarea
                value={form.descLonga}
                onChange={(event) => changeField("descLonga", event.target.value)}
                rows={3}
                placeholder="Detalhes do produto ou do curso"
                maxLength={2000}
              />
            </label>
            <label className="adsFullWidth">
              Benefícios separados por vírgula
              <input
                value={form.beneficios}
                onChange={(event) => changeField("beneficios", event.target.value)}
                placeholder="Ex.: Aulas práticas, certificado, suporte"
                maxLength={1000}
              />
            </label>
            <label>
              Responsável pelo anúncio
              <input
                required
                value={form.proprietario}
                onChange={(event) => changeField("proprietario", event.target.value)}
                placeholder="Nome do responsável"
                maxLength={255}
              />
            </label>
            <label>
              WhatsApp com indicativo do país
              <input
                required
                type="tel"
                value={form.whatsapp}
                onChange={(event) => changeField("whatsapp", event.target.value)}
                placeholder="244923000000"
                maxLength={32}
              />
            </label>
          </div>
          {formError && <p className="crmErr" role="alert">{formError}</p>}
          <button type="submit" className="crmBtn adsSubmit" disabled={saving || sourcesLoading}>
            {saving ? "A guardar…" : editingId ? "Guardar alterações" : "Gerar link do anúncio"}
          </button>
          {generatedLink && (
            <div className="adsGeneratedLink" role="status">
              <strong>Link gerado com sucesso</strong>
              <div className="adsLinkRow">
                <input readOnly value={generatedLink} aria-label="Link público do anúncio" />
                <button type="button" className="crmBtn" onClick={() => void copyLink(generatedLink)}>
                  {copyStatus === "Link copiado." ? "Copiado" : "Copiar"}
                </button>
              </div>
              <a href={generatedLink} target="_blank" rel="noreferrer">Abrir página pública</a>
              {copyStatus && copyStatus !== "Link copiado." && <p className="crmErr">{copyStatus}</p>}
            </div>
          )}
        </form>

        <aside className="adsAside">
          <div>
            <span className="adsEyebrow">Pré-visualização ao vivo</span>
            <article className="adsPreviewCard">
              <div className="adsPreviewImage">
                {imageUrl
                  ? <CachedImage src={imageUrl} blurHash={imageBlurHash} alt={title ? `Pré-visualização de ${title}` : ""} />
                  : <span>Selecione um produto ou curso para ver a imagem</span>}
                <div className="adsImageShade" />
                <div className="adsBadges">
                  <span>{category || "Categoria"}</span>
                  <strong>{form.badge || "NOVO"}</strong>
                </div>
                <div className="adsPreviewCopy">
                  <h3>{title || "O título do seu anúncio aparecerá aqui"}</h3>
                  <p>{form.descCurta || "A descrição curta aparecerá aqui"}</p>
                </div>
              </div>
              <div className="adsPreviewFooter">
                <strong>{price || "Preço do anúncio"}</strong>
                <span>Ver oferta</span>
              </div>
            </article>
          </div>
          <div className="crmCard adsHowItWorks">
            <h3>Como funciona o link?</h3>
            <ol>
              <li>Escolha um produto ou curso que já registou.</li>
              <li>O card usa a imagem e os dados desse registo.</li>
              <li>Gere e partilhe o link público do anúncio.</li>
              <li>O cliente vê os detalhes e pode contactar pelo WhatsApp.</li>
            </ol>
          </div>
        </aside>
      </div>

      <section className="adsAnalytics">
        <div className="adsAnalyticsHead">
          <div>
            <h3>Desempenho dos anúncios</h3>
            <p>Visitantes únicos são estimados por navegador; a conversão é calculada como leads ÷ visualizações.</p>
          </div>
          <div className="crmRow">
            <label className="adsPeriodSelect">
              Período
              <select value={period} onChange={(event) => setPeriod(event.target.value)}>
                <option value="7d">Últimos 7 dias</option>
                <option value="30d">Últimos 30 dias</option>
                <option value="90d">Últimos 90 dias</option>
              </select>
            </label>
            <button type="button" className="crmBtn ghost" onClick={refreshAnalytics} disabled={metricsLoading}>
              Atualizar
            </button>
          </div>
        </div>
        {metricsError && (
          <p className="crmErr" role="alert">
            {metricsError}{" "}
            <button type="button" className="crmBtn ghost" onClick={() => setMetricsRefresh((value) => value + 1)}>
              Tentar novamente
            </button>
          </p>
        )}
        {metricsLoading && <p>A carregar métricas…</p>}
        {metrics && (
          <>
            <div className="adsKpis">
              <article><span>Visualizações</span><strong>{metrics.totais.visualizacoes}</strong></article>
              <article><span>Visitantes únicos</span><strong>{metrics.totais.visitantes_unicos}</strong></article>
              <article><span>Cliques</span><strong>{metrics.totais.cliques}</strong></article>
              <article><span>Leads</span><strong>{metrics.totais.leads}</strong></article>
              <article><span>Conversão</span><strong>{metrics.totais.taxa_conversao}%</strong></article>
            </div>
            <div className="crmCard adsChartCard">
              <h4>Atividade diária</h4>
              <AnalyticsChart series={metrics.serie} />
            </div>
          </>
        )}
      </section>

      <section className="adsListing">
        <div className="adsListingHead">
          <div>
            <h3>Os seus anúncios</h3>
            <p>{rows.length} {rows.length === 1 ? "anúncio guardado" : "anúncios guardados"}</p>
          </div>
          <button type="button" className="crmBtn ghost" onClick={refreshAnalytics}>
            Atualizar métricas
          </button>
        </div>
        {adsError && (
          <p className="crmErr" role="alert">
            {adsError}{" "}
            <button type="button" className="crmBtn ghost" onClick={() => void reload().catch(() => {})}>
              Tentar novamente
            </button>
          </p>
        )}
        {copyStatus && <p className="adsHint" role="status">{copyStatus}</p>}
        {load && <p>A carregar anúncios…</p>}
        {!load && !rows.length && !adsError && (
          <div className="crmCard adsEmpty">Ainda não criou nenhum anúncio.</div>
        )}
        <div className="adsGrid">
          {rows.map((ad) => {
            const adImage = getImageUrl(ad.img, backend);
            const link = api.publicAdShareUrl(ad.id);
            const adMetrics = metricsByAd.get(String(ad.id));
            return (
              <article className="adsSavedCard" key={ad.id}>
                <a className="adsSavedImage" href={link} target="_blank" rel="noreferrer" aria-label={`Abrir anúncio ${ad.title}`}>
                  <img src={adImage} alt={ad.title} />
                  <div className="adsImageShade" />
                  <div className="adsBadges">
                    <span>{ad.categoria}</span>
                    <strong>{ad.badge}</strong>
                  </div>
                </a>
                <div className="adsSavedContent">
                  <h4>{ad.title}</h4>
                  <p>{ad.descCurta}</p>
                  <div className="adsCardMetrics" aria-label="Métricas do anúncio">
                    <span><strong>{adMetrics?.visualizacoes || 0}</strong> visualizações</span>
                    <span><strong>{adMetrics?.visitantes_unicos || 0}</strong> visitantes únicos</span>
                    <span><strong>{adMetrics?.cliques || 0}</strong> cliques</span>
                    <span><strong>{adMetrics?.leads || 0}</strong> leads</span>
                    <span><strong>{adMetrics?.taxa_conversao || 0}%</strong> conversão</span>
                  </div>
                  <div className="adsSavedFooter">
                    <strong>{ad.preco}</strong>
                    <div className="adsActions">
                      <button type="button" aria-label="Copiar link do anúncio" title="Copiar link" onClick={() => void copyLink(link)}>↗</button>
                      <button type="button" aria-label="Editar anúncio" title="Editar" onClick={() => editAdvertisement(ad)}><Ico n="edit" /></button>
                      <button type="button" aria-label="Eliminar anúncio" title="Eliminar" onClick={() => void deleteAdvertisement(ad)}><Ico n="trash" /></button>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}
