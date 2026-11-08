import "./css/Conteiner4ConteinerAfiliadosDados.css"
export default function Conteiner4ConteinerAfiliadoDados({ nome = "Cláudio Avelino", descricao = "Afiliado ativo · Produtos", atraso = 0 }) {
    const iniciais = nome
        .split(/\s+/)
        .slice(0, 2)
        .map((parte) => parte[0])
        .join("")
        .toUpperCase();

    return (
        <article className="Conteiner4ConteinerAfiliadosDados" style={{ animationDelay: `${0.3 + atraso * 0.12}s` }}>
            <div className="Conteiner4ConteinerAfiliadoDadosIcone" aria-hidden="true">{iniciais}</div>
            <div className="Conteiner4ConteinerAfiliadoDadosText">
                <b>{nome}</b>
                <span>{descricao}</span>
            </div>
            <div className="Conteiner4ConteinerAfiliadoDadosBtn">
                <button type="button">Dados</button>
                <button type="button">Conversa</button>
            </div>
        </article>
    )
}