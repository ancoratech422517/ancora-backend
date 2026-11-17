import { useCallback, useEffect, useRef, useState } from "react";
import { useUserStore } from "../../useUseSotore";
import { fetchComAuth } from "../../utils/api";

function dashboardValido(data) {
    const metricas = [
        "produtos",
        "pedidos",
        "pedidos_pendentes",
        "clientes",
        "clientes_recorrentes",
        "visualizacoes",
        "favoritos",
    ];
    return Boolean(
        data
        && metricas.every((campo) => Number.isFinite(Number(data[campo])))
        && Array.isArray(data.produtos_detalhe)
        && Array.isArray(data.produtos_lista)
        && Array.isArray(data.clientes_detalhe)
        && Array.isArray(data.clientes_serie)
        && Array.isArray(data.afiliados)
        && Array.isArray(data.afiliados_serie)
        && Number.isFinite(Number(data.afiliados_total))
        && typeof data.codigo_convite === "string"
    );
}

export default function useLojaDashboard() {
    const backendUrl = useUserStore((state) => state.urlBancoDeDados);
    const userId = useUserStore((state) => state.dadosUsuario?.id);
    const socket = useUserStore((state) => state.socket);
    const [dashboard, setDashboard] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const dashboardRef = useRef(null);
    const requestRef = useRef(null);

    const refresh = useCallback(async () => {
        if (!userId || !backendUrl) {
            setDashboard(null);
            dashboardRef.current = null;
            setLoading(false);
            setError("Inicia sessão para carregar os dados da tua loja.");
            return;
        }

        requestRef.current?.abort();
        const controller = new AbortController();
        requestRef.current = controller;
        setLoading(!dashboardRef.current);
        setError("");

        try {
            const base = String(backendUrl).replace(/\/+$/, "");
            const response = await fetchComAuth(`${base}/api/dashboard/loja`, {
                method: "GET",
                signal: controller.signal,
                offlineQueue: false,
            });
            const data = await response.json().catch(() => null);
            if (!response.ok) {
                throw new Error(data?.error || `Não foi possível carregar o dashboard (${response.status}).`);
            }
            if (!dashboardValido(data)) {
                throw new Error("O servidor devolveu dados inválidos para o dashboard.");
            }
            dashboardRef.current = data;
            setDashboard(data);
        } catch (requestError) {
            if (requestError?.name !== "AbortError") {
                setError(requestError.message || "Não foi possível carregar os dados da loja.");
            }
        } finally {
            if (requestRef.current === controller) {
                requestRef.current = null;
                setLoading(false);
            }
        }
    }, [backendUrl, userId]);

    useEffect(() => {
        dashboardRef.current = null;
        setDashboard(null);
        setLoading(true);
        void refresh();

        const refreshForAccount = (payload) => {
            const eventUserId = payload?.id_usuario ?? payload?.destinatario_id;
            if (eventUserId != null && String(eventUserId) !== String(userId)) return;
            void refresh();
        };
        const refreshWhenVisible = () => {
            if (document.visibilityState === "visible") void refresh();
        };

        socket?.on("produto_registrado", refreshForAccount);
        socket?.on("notificar_usuario_compra_produto", refreshForAccount);
        socket?.on("afiliado_registado", refreshForAccount);
        window.addEventListener("focus", refreshWhenVisible);
        document.addEventListener("visibilitychange", refreshWhenVisible);

        return () => {
            requestRef.current?.abort();
            socket?.off("produto_registrado", refreshForAccount);
            socket?.off("notificar_usuario_compra_produto", refreshForAccount);
            socket?.off("afiliado_registado", refreshForAccount);
            window.removeEventListener("focus", refreshWhenVisible);
            document.removeEventListener("visibilitychange", refreshWhenVisible);
        };
    }, [refresh, socket, userId]);

    return { dashboard, loading, error, refresh };
}
