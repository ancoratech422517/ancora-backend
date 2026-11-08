import "./css/Conteiner4ConteinerClienreDados.css";

export default function Conteiner4ConteinerClienteDados({ nome, descricao, atraso = 0, onConversar }) {
    const iniciais = nome
        .split(/\s+/)
        .slice(0, 2)
        .map((parte) => parte[0])
        .join("")
        .toUpperCase();

    return (
        <article className="cliente-item" style={{ animationDelay: `${0.3 + atraso * 0.12}s` }}>
            <div className="cliente-avatar" aria-hidden="true">{iniciais}</div>
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
