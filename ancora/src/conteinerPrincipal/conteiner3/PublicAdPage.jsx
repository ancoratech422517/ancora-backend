import { useEffect, useRef, useState } from "react";
import { api } from "./api";
import "./css/Anuncios.css";

const VISITOR_STORAGE_KEY = "ancora-ad-visitor-id";
let cachedVisitorId = "";

function createVisitorId() {
  if (window.crypto?.randomUUID) return window.crypto.randomUUID();
  if (!window.crypto?.getRandomValues) throw new Error("Este navegador não permite criar um identificador anónimo.");
  return Array.from(window.crypto.getRandomValues(new Uint8Array(16)))
    .map((value) => value.toString(16).padStart(2, "0"))
    .join("");
}

function getVisitorId() {
  if (cachedVisitorId) return cachedVisitorId;
  const generated = createVisitorId();
  try {
    cachedVisitorId = window.localStorage.getItem(VISITOR_STORAGE_KEY) || generated;
    window.localStorage.setItem(VISITOR_STORAGE_KEY, cachedVisitorId);
    return cachedVisitorId;
  } catch (storageError) {
    console.warn("Armazenamento local indisponível; usando identificador desta sessão:", storageError);
    try {
      cachedVisitorId = window.sessionStorage.getItem(VISITOR_STORAGE_KEY) || generated;
      window.sessionStorage.setItem(VISITOR_STORAGE_KEY, cachedVisitorId);
      return cachedVisitorId;
    } catch {
      throw new Error("Não foi possível guardar o identificador anónimo para as métricas.");
    }
  }
}

export default function PublicAdPage({ adId }) {
  const [advertisement, setAdvertisement] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showInterestForm, setShowInterestForm] = useState(false);
  const [submittingLead, setSubmittingLead] = useState(false);
  const [leadError, setLeadError] = useState("");
  const [leadStatus, setLeadStatus] = useState("");
  const [metricsError, setMetricsError] = useState("");
  const [leadContact, setLeadContact] = useState(null);
  const viewTracked = useRef(false);

  useEffect(() => {
    let active = true;
    api.publicAd(adId)
      .then((record) => {
        if (!active) return;
        setAdvertisement(record);
        if (!viewTracked.current) {
          viewTracked.current = true;
          try {
            api.trackPublicAd(adId, "visualizacao", getVisitorId()).catch((trackingError) => {
              if (active) {
                console.error("Falha ao registar visualização do anúncio:", trackingError);
                setMetricsError("Não foi possível atualizar as métricas deste anúncio.");
              }
            });
          } catch (trackingError) {
            if (active) {
              console.error("Falha ao criar identificador anónimo:", trackingError);
              setMetricsError(trackingError.message || "Não foi possível atualizar as métricas deste anúncio.");
            }
          }
        }
      })
      .catch((requestError) => {
        if (active) setError(requestError.message || "Não foi possível carregar este anúncio.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [adId]);

  function trackClick() {
    try {
      api.trackPublicAd(adId, "clique", getVisitorId()).catch((trackingError) => {
        console.error("Falha ao registar clique no anúncio:", trackingError);
        setMetricsError("Não foi possível atualizar as métricas deste anúncio.");
      });
    } catch (trackingError) {
      console.error("Falha ao criar identificador anónimo:", trackingError);
      setMetricsError(trackingError.message || "Não foi possível atualizar as métricas deste anúncio.");
    }
  }

  async function contactOwner(event) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const name = String(formData.get("name") || "").trim();
    const phone = String(formData.get("phone") || "").trim();
    const email = String(formData.get("email") || "").trim();
    setSubmittingLead(true);
    setLeadError("");
    try {
      await api.submitPublicLead(adId, {
        nome: name,
        telefone: phone,
        email,
        visitante: getVisitorId(),
      });
      setLeadContact({ name, phone, email });
      setLeadStatus("O seu interesse foi registado no CRM do responsável pelo anúncio.");
      setShowInterestForm(false);
    } catch (requestError) {
      setLeadError(requestError.message || "Não foi possível registar o seu interesse.");
    } finally {
      setSubmittingLead(false);
    }
  }

  if (loading) {
    return <main className="publicAdPage"><p>A carregar anúncio…</p></main>;
  }

  if (error || !advertisement) {
    return (
      <main className="publicAdPage">
        <section className="publicAdMessage">
          <h1>Anúncio não encontrado</h1>
          <p>{error || "Este anúncio pode ter sido removido."}</p>
          <a className="publicAdButton secondary" href={window.location.pathname}>Voltar à Âncora</a>
        </section>
      </main>
    );
  }

  const benefits = String(advertisement.beneficios || "")
    .split(",")
    .map((benefit) => benefit.trim())
    .filter(Boolean);
  const whatsapp = String(advertisement.whatsapp || "").replace(/\D/g, "");
  const whatsappMessage = leadContact
    ? `Olá, sou ${leadContact.name}${leadContact.phone ? ` (${leadContact.phone})` : ""}${leadContact.email ? `, ${leadContact.email}` : ""}. Já registei interesse em "${advertisement.title}" (${window.location.href}).`
    : `Olá! Vi o anúncio "${advertisement.title}" no link ${window.location.href} e tenho interesse.`;
  const whatsappLink = `https://wa.me/${whatsapp}?text=${encodeURIComponent(whatsappMessage)}`;

  return (
    <main className="publicAdPage">
      <header className="publicAdHeader">
        <a className="publicAdBrand" href={window.location.pathname}>
          <span>Â</span>
          <strong>Âncora</strong>
          <small>Anúncio verificado</small>
        </a>
      </header>
      <div className="publicAdContent">
        <section className="publicAdVisual">
          <div className="publicAdImage">
            <img src={advertisement.img} alt={advertisement.title} />
          </div>
          <div className="publicAdVerified">
            <span>✓</span>
            <div>
              <strong>Anúncio publicado na Âncora</strong>
              <p>Informação partilhada pelo responsável do anúncio.</p>
            </div>
          </div>
        </section>
        <section className="publicAdDetails">
          <div className="publicAdTags">
            <strong>{advertisement.badge}</strong>
            <span>{advertisement.categoria}</span>
          </div>
          <h1>{advertisement.title}</h1>
          <p className="publicAdPrice">{advertisement.preco}</p>
          {advertisement.descLonga && <p className="publicAdDescription">{advertisement.descLonga}</p>}
          {benefits.length > 0 && (
            <ul className="publicAdBenefits">
              {benefits.map((benefit, index) => <li key={`${benefit}-${index}`}>{benefit}</li>)}
            </ul>
          )}
          <div className="publicAdOwner">
            <span>{String(advertisement.proprietario || "Âncora").charAt(0).toUpperCase()}</span>
            <div>
              <strong>{advertisement.proprietario}</strong>
              <small>Responsável pelo anúncio</small>
            </div>
          </div>
          <div className="publicAdActions">
            <a className="publicAdButton" href={whatsappLink} target="_blank" rel="noreferrer" onClick={trackClick}>
              Falar pelo WhatsApp
            </a>
            <button className="publicAdButton secondary" type="button" onClick={() => { setShowInterestForm(true); setLeadError(""); trackClick(); }}>
              Registar interesse
            </button>
          </div>
          {leadStatus && (
            <p className="publicAdFeedback success" role="status">
              {leadStatus}{" "}
              <a href={whatsappLink} target="_blank" rel="noreferrer" onClick={trackClick}>Falar pelo WhatsApp</a>
            </p>
          )}
          <p className="publicAdPrivacyNote">
            As visitas são estimadas com um identificador aleatório guardado no navegador, sem usar o seu nome ou telefone.
          </p>
          {metricsError && <p className="publicAdFeedback" role="alert">{metricsError}</p>}
        </section>
      </div>

      {showInterestForm && (
        <div className="publicAdModal" onClick={() => setShowInterestForm(false)}>
          <form className="publicAdInterest" onSubmit={contactOwner} onClick={(event) => event.stopPropagation()}>
            <button className="publicAdClose" type="button" onClick={() => setShowInterestForm(false)} aria-label="Fechar">×</button>
            <h2>Registar interesse</h2>
            <p>Os seus dados serão guardados como lead no CRM do responsável pelo anúncio.</p>
            <label>Seu nome<input name="name" required maxLength={120} /></label>
            <label>Seu WhatsApp<input name="phone" type="tel" required maxLength={32} /></label>
            <label>Email (opcional)<input name="email" type="email" maxLength={255} /></label>
            {leadError && <p className="crmErr" role="alert">{leadError}</p>}
            <button className="publicAdButton" type="submit" disabled={submittingLead}>
              {submittingLead ? "A registar…" : "Registar interesse"}
            </button>
          </form>
        </div>
      )}
    </main>
  );
}
