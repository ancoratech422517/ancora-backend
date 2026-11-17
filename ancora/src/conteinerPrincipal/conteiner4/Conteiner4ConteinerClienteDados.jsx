import "./css/Conteiner4ConteinerClienreDados.css";
import { useUserStore } from "../../useUseSotore";

export default function Conteiner4ConteinerClienteDados({ nome = "Cliente", foto, descricao, atraso = 0, onConversar }) {
    const backendUrl = useUserStore((state) => state.urlBancoDeDados);
    const iniciais = nome
        .split(/\s+/)
        .slice(0, 2)
        .map((parte) => parte[0])
        .join("")
        .toUpperCase();
    const fotoUrl = typeof foto === "string" && foto && foto !== "none"
        ? (/^(https?:\/\/|data:image\/)/i.test(foto)
            ? foto
            : `${String(backendUrl || "").replace(/\/+$/, "")}/${foto.replace(/^\/+/, "")}`)
        : "";

    return (
        <article className="cliente-item" style={{ animationDelay: `${0.3 + atraso * 0.12}s` }}>
            <div className="cliente-avatar" aria-hidden="true">
                {fotoUrl
                    ? <img src={fotoUrl} alt="" loading="lazy" />
                    : iniciais}
            </div>
            <div className="cliente-dados">
                <b>{nome}</b>
                <span>{descricao}</span>
            </div>
            <button type="button" className="cliente-conversar" onClick={onConversar}>
                Conversar
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M4 5h16a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1h-8l-5 4v-4H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1z" />
                </svg>
            </button>
        </article>
    );
}
