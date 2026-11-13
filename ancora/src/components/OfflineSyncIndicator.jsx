import { useEffect, useState } from "react";
import { useUserStore } from "../useUseSotore";
import { getOutboxEntries } from "../utils/offlineStorage";

export default function OfflineSyncIndicator() {
  const userId = useUserStore((state) => state.dadosUsuario?.id);
  const [online, setOnline] = useState(navigator.onLine);
  const [entries, setEntries] = useState([]);

  useEffect(() => {
    const refresh = () => {
      setOnline(navigator.onLine);
      if (userId == null) {
        setEntries([]);
        return;
      }
      getOutboxEntries(userId)
        .then(setEntries)
        .catch((error) => console.error("Não foi possível consultar a fila offline:", error));
    };
    window.addEventListener("online", refresh);
    window.addEventListener("offline", refresh);
    window.addEventListener("ancora:offline-storage-change", refresh);
    refresh();
    return () => {
      window.removeEventListener("online", refresh);
      window.removeEventListener("offline", refresh);
      window.removeEventListener("ancora:offline-storage-change", refresh);
    };
  }, [userId]);

  const pendingCount = entries.filter((entry) => entry.status !== "failed").length;
  const failedCount = entries.filter((entry) => entry.status === "failed").length;
  if (online && pendingCount === 0 && failedCount === 0) return null;

  const label = !online
    ? `Sem ligação${pendingCount ? ` · ${pendingCount} ação(ões) na fila` : ""}`
    : `${pendingCount} ação(ões) a sincronizar${failedCount ? ` · ${failedCount} com erro` : ""}`;

  return (
    <div
      role="status"
      aria-live="polite"
      title={failedCount ? entries.find((entry) => entry.status === "failed")?.lastError : undefined}
      style={{
        position: "fixed",
        zIndex: 100000,
        left: "50%",
        bottom: 16,
        transform: "translateX(-50%)",
        maxWidth: "calc(100vw - 24px)",
        padding: "9px 14px",
        borderRadius: 999,
        background: failedCount ? "var(--danger, #b42318)" : "var(--teal-700, #006b68)",
        color: "var(--text-on-primary, #fff)",
        boxShadow: "0 4px 16px rgba(0,0,0,.2)",
        fontSize: 13,
        fontWeight: 600,
        textAlign: "center",
      }}
    >
      {label}
    </div>
  );
}
