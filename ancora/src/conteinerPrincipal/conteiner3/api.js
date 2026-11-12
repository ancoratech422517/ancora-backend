import { useCallback, useEffect, useState } from "react";
import { useUserStore } from "../../useUseSotore";
import { fetchComAuth } from "../../utils/api";

const RESOURCES = new Set([
  "projectos",
  "clientes",
  "financeiro",
  "faturas",
  "turmas",
  "calendario",
  "anuncios",
  "leads",
]);

let online = null;
const subscribers = new Set();

function markOnline(value) {
  if (value !== online) {
    online = value;
    subscribers.forEach((subscriber) => subscriber(value));
  }
}

export const onStatus = (subscriber) => {
  subscribers.add(subscriber);
  subscriber(online);
  return () => subscribers.delete(subscriber);
};

function getApiBase() {
  const configured = import.meta.env.VITE_API_URL;
  const backend = useUserStore.getState().urlBancoDeDados;
  const base = String(configured || backend || "").trim().replace(/\/+$/, "");
  if (!base) throw new Error("O endereço do backend não está configurado.");

  if (base.endsWith("/api/crm")) return base;
  if (base.endsWith("/api")) return `${base}/crm`;
  return `${base}/api/crm`;
}

async function http(method, path, body) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);
  let reachedBackend = false;

  try {
    const response = await fetchComAuth(`${getApiBase()}${path}`, {
      method,
      signal: controller.signal,
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    reachedBackend = true;
    markOnline(true);
    const text = response.status === 204 ? "" : await response.text();
    let data = null;
    if (text) {
      try {
        data = JSON.parse(text);
      } catch {
        data = null;
      }
    }
    if (!response.ok) {
      throw new Error(data?.error || data?.erro || data?.message || `Erro ${response.status}`);
    }
    return data;
  } catch (error) {
    if (!reachedBackend && error?.message !== "Sessão expirada") markOnline(false);
    if (error?.name === "AbortError") {
      throw new Error("O backend demorou demasiado a responder. Tenta novamente.");
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

function resourcePath(resource) {
  if (!RESOURCES.has(resource)) throw new Error("Recurso do CRM inválido");
  return `/${encodeURIComponent(resource)}`;
}

export const ymd = (dateValue) => {
  const pad = (value) => String(value).padStart(2, "0");
  return `${dateValue.getFullYear()}-${pad(dateValue.getMonth() + 1)}-${pad(dateValue.getDate())}`;
};

export const api = {
  async list(resource) {
    const response = await http("GET", resourcePath(resource));
    const records = response?.data ?? response?.items ?? response?.dados;
    if (!Array.isArray(records)) throw new Error("O backend devolveu uma lista inválida.");
    return records;
  },

  async create(resource, data) {
    const response = await http("POST", resourcePath(resource), data);
    if (!response?.data) throw new Error("O backend não confirmou o registo.");
    return response.data;
  },

  async update(resource, id, data) {
    const response = await http(
      "PUT",
      `${resourcePath(resource)}/${encodeURIComponent(id)}`,
      data,
    );
    if (!response?.data) throw new Error("O backend não confirmou a alteração.");
    return response.data;
  },

  async remove(resource, id) {
    await http("DELETE", `${resourcePath(resource)}/${encodeURIComponent(id)}`);
  },

  dashboard: () => http("GET", "/dashboard"),
  async adMetrics(period) {
    const response = await http("GET", `/anuncios/metricas?periodo=${encodeURIComponent(period)}`);
    if (!response?.data?.totais || !Array.isArray(response.data.serie) || !Array.isArray(response.data.anuncios)) {
      throw new Error("O servidor devolveu métricas de anúncios inválidas.");
    }
    return response.data;
  },
  async publicAd(id) {
    const response = await http("GET", `/public/anuncios/${encodeURIComponent(id)}`);
    if (!response?.data) throw new Error("Anúncio não encontrado.");
    return response.data;
  },
  async trackPublicAd(id, type, visitorId) {
    await http("POST", `/public/anuncios/${encodeURIComponent(id)}/eventos`, {
      tipo: type,
      visitante: visitorId,
    });
  },
  async submitPublicLead(id, lead) {
    const response = await http("POST", `/public/anuncios/${encodeURIComponent(id)}/leads`, lead);
    if (!response?.data) throw new Error("O servidor não confirmou o registo do interesse.");
    return response.data;
  },
};

export function useList(resource) {
  const [rows, setRows] = useState([]);
  const [load, setLoad] = useState(true);
  const [error, setError] = useState("");

  const reload = useCallback(async () => {
    setLoad(true);
    try {
      const records = await api.list(resource);
      setRows(records);
      setError("");
      return records;
    } catch (requestError) {
      setRows([]);
      setError(requestError.message || "Não foi possível carregar os dados do CRM.");
      throw requestError;
    } finally {
      setLoad(false);
    }
  }, [resource]);

  useEffect(() => {
    void reload().catch(() => {});
  }, [reload]);

  return { rows, load, error, reload };
}

export async function loadDash() {
  const dashboard = await api.dashboard();
  if (!dashboard?.kpi || !Array.isArray(dashboard.serie)) {
    throw new Error("O backend devolveu dados de dashboard inválidos.");
  }
  return dashboard;
}
