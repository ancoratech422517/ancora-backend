import { useMemo, useState } from "react";
import { useUserStore } from "../../useUseSotore";
import { api } from "./api";
import { criarDocumentoArrendamento } from "../../utils/rentalDocx";
import { enviarDocxParaAmigo } from "../../utils/enviarDocxParaAmigo";

const INICIAL = { inquilino: "", data_pagamento: "", valor_pago: "", data_fim: "", senhoria: "" };

function baixarDocumento(file) {
  const url = URL.createObjectURL(file);
  const link = document.createElement("a");
  link.href = url;
  link.download = file.name;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export default function ArrendamentoProjectModal({ onClose, onRegistered }) {
  const amigos = useUserStore((state) => state.amigos);
  const [form, setForm] = useState(INICIAL);
  const [documento, setDocumento] = useState(null);
  const [registado, setRegistado] = useState(false);
  const [mostrarAmigos, setMostrarAmigos] = useState(false);
  const [amigoId, setAmigoId] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");

  const amigoSelecionado = useMemo(
    () => amigos.find((amigo) => String(amigo.id_amigo) === String(amigoId)),
    [amigos, amigoId],
  );

  const atualizar = (campo) => (event) => {
    setForm((current) => ({ ...current, [campo]: event.target.value }));
  };

  const registar = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const dados = {
        inquilino: form.inquilino.trim(),
        data_pagamento: form.data_pagamento,
        valor_pago: Number(form.valor_pago),
        data_fim: form.data_fim,
        senhoria: form.senhoria.trim(),
      };
      const file = await criarDocumentoArrendamento(dados);
      await api.create("projectos", {
        nome: `Arrendamento - ${dados.inquilino}`,
        cliente: dados.inquilino,
        estado: "Em curso",
        orcamento: 0,
        prazo: dados.data_fim,
        progresso: 0,
        arrendamento: dados,
      });
      setDocumento(file);
      setRegistado(true);
      setStatus("Projeto registado com sucesso.");
      void onRegistered?.();
    } catch (requestError) {
      setError(requestError.message || "Não foi possível registar o arrendamento.");
    } finally {
      setBusy(false);
    }
  };

  const partilharWhatsApp = async () => {
    if (!documento) return;
    setBusy(true);
    setError("");
    try {
      const files = [documento];
      if (navigator.share && navigator.canShare?.({ files })) {
        await navigator.share({
          title: "Registo de arrendamento",
          text: `Registo de arrendamento de ${form.inquilino}.`,
          files,
        });
        setStatus("Documento partilhado.");
      } else {
        baixarDocumento(documento);
        window.open(
          `https://wa.me/?text=${encodeURIComponent(`Segue o registo de arrendamento de ${form.inquilino}. Anexa o ficheiro DOCX descarregado.`)}`,
          "_blank",
          "noopener,noreferrer",
        );
        setStatus("O DOCX foi descarregado. Anexa-o à conversa do WhatsApp aberta.");
      }
    } catch (shareError) {
      if (shareError.name !== "AbortError") {
        setError(shareError.message || "Não foi possível partilhar pelo WhatsApp.");
      }
    } finally {
      setBusy(false);
    }
  };

  const enviarParaAmigo = async () => {
    if (!documento || !amigoSelecionado) return;
    setBusy(true);
    setError("");
    try {
      await enviarDocxParaAmigo(documento, amigoSelecionado);
      setStatus(`Documento enviado para ${amigoSelecionado.nome || amigoSelecionado.nome_amigo || "o amigo"}. A conversa foi aberta.`);
    } catch (sendError) {
      setError(sendError.message || "Não foi possível enviar o documento na Ancora.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="crmModal" onClick={onClose}>
      {!registado ? (
        <form className="crmCard rentalModal" onClick={(event) => event.stopPropagation()} onSubmit={(event) => void registar(event)}>
          <div className="rentalModalHeader">
            <div>
              <span className="rentalEyebrow">Novo projeto</span>
              <h3>Registo de arrendamento</h3>
            </div>
            <button type="button" className="crmBtn ghost rentalClose" onClick={onClose} aria-label="Fechar formulário">×</button>
          </div>
          <label>Nome do inquilino
            <input autoFocus required maxLength={255} value={form.inquilino} onChange={atualizar("inquilino")} />
          </label>
          <label>Data do pagamento mensal
            <input required type="date" value={form.data_pagamento} onChange={atualizar("data_pagamento")} />
          </label>
          <label>Valor pago pelo inquilino (Kz)
            <input required type="number" min="0" step="0.01" value={form.valor_pago} onChange={atualizar("valor_pago")} />
          </label>
          <label>Data de término do arrendamento
            <input required type="date" value={form.data_fim} onChange={atualizar("data_fim")} />
          </label>
          <label>Nome da senhoria
            <input required maxLength={255} value={form.senhoria} onChange={atualizar("senhoria")} />
          </label>
          {error && <p className="crmErr" role="alert">{error}</p>}
          <div className="crmRow rentalActions">
            <button type="button" className="crmBtn ghost" onClick={onClose}>Cancelar</button>
            <button type="submit" className="crmBtn" disabled={busy}>{busy ? "A registar..." : "Registar projeto"}</button>
          </div>
        </form>
      ) : (
        <section className="crmCard rentalModal rentalShareModal" onClick={(event) => event.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="rental-share-title">
          <div className="rentalModalHeader">
            <div>
              <span className="rentalEyebrow">Projeto registado</span>
              <h3 id="rental-share-title">Partilhar documento</h3>
            </div>
            <button type="button" className="crmBtn ghost rentalClose" onClick={onClose} aria-label="Fechar partilha">×</button>
          </div>
          <p>O registo de {form.inquilino} foi guardado em Projetos e o DOCX está pronto.</p>
          {status && <p className="rentalShareStatus" role="status">{status}</p>}
          {error && <p className="crmErr" role="alert">{error}</p>}
          <div className="rentalShareActions">
            <button type="button" className="crmBtn" onClick={() => void partilharWhatsApp()} disabled={busy}>
              {busy && !mostrarAmigos ? "A preparar..." : "Partilhar no WhatsApp"}
            </button>
            <button type="button" className="crmBtn ghost" onClick={() => setMostrarAmigos((open) => !open)} disabled={busy}>
              Enviar para amigo na Ancora
            </button>
          </div>
          {mostrarAmigos && (
            <div className="rentalFriendForm">
              <label>Selecionar amigo
                <select value={amigoId} onChange={(event) => setAmigoId(event.target.value)} required>
                  <option value="">Escolher amigo...</option>
                  {amigos.map((amigo) => (
                    <option key={amigo.id_amigo} value={amigo.id_amigo}>
                      {amigo.nome || amigo.nome_amigo || `Utilizador ${amigo.id_amigo}`}
                    </option>
                  ))}
                </select>
              </label>
              <button type="button" className="crmBtn" onClick={() => void enviarParaAmigo()} disabled={busy || !amigoSelecionado}>
                {busy && mostrarAmigos ? "A enviar..." : "Enviar DOCX"}
              </button>
              {!amigos.length && <p className="rentalHint">Não há amigos disponíveis para selecionar.</p>}
            </div>
          )}
          <div className="crmRow rentalActions">
            <button type="button" className="crmBtn ghost" onClick={() => baixarDocumento(documento)}>Descarregar DOCX</button>
            <button type="button" className="crmBtn" onClick={onClose}>Concluir</button>
          </div>
        </section>
      )}
    </div>
  );
}