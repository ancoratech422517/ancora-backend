import "./css/Conteiner4ConteinerAfiliadosDados.css"
import { useUserStore } from "../../useUseSotore";

export default function Conteiner4ConteinerAfiliadoDados({ nome = "Afiliado", foto, descricao = "", atraso = 0 }) {
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
        <article className="Conteiner4ConteinerAfiliadosDados" style={{ animationDelay: `${0.3 + atraso * 0.12}s` }}>
            <div className="Conteiner4ConteinerAfiliadoDadosIcone" aria-hidden="true">
                {fotoUrl ? <img src={fotoUrl} alt="" loading="lazy" /> : iniciais}
            </div>
            <div className="Conteiner4ConteinerAfiliadoDadosText">
                <b>{nome}</b>
                <span>{descricao}</span>
            </div>
        </article>
    )
}
