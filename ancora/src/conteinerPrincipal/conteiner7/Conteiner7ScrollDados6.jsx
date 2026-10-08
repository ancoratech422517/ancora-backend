import "./css/Conteiner7Scrolldados6.css"
import { useUserStore } from "../../useUseSotore";
import { Conteiner7Scrolldados6AceitarConviteTurma } from "./js/Conteiner7ScrollDados6AceitarConvite";
import { Conteiner7ScrollDadosRecusarConvite } from "./js/Conteiner7ScrollDadosRecusarConvite";
export default function Conteiner7ScrollDados6 ({dados}){
    const {
        urlBancoDeDados,
        dadosUsuario,
        setTurmaUsuario
    } = useUserStore()
    const getUrlVideo = (url) => {
        if (!url) return "";
            // Verifica se a URL já começa com http ou https
            const isUrlCompleta = url.startsWith("http://") || url.startsWith("https://");
            
            return isUrlCompleta ? url : `${urlBancoDeDados}/${url}`;
        };

    const IMAGE = getUrlVideo(dados.foto_usuario)
    const aceitarConviteOuSolicitacao = () => {
        const ehSolicitacao = dados.tipo_notificacao === "solicitacao"
        const idUsuarioNovo = ehSolicitacao ? dados.de_id : dadosUsuario?.id
        const idAdmin = ehSolicitacao ? dadosUsuario?.id : dados.de_id

        return Conteiner7Scrolldados6AceitarConviteTurma(
            dados.id_turma_convite,
            idUsuarioNovo,
            idAdmin,
            dadosUsuario?.id,
            dados.id,
            dados.tipo_notificacao,
            setTurmaUsuario
        )
    }

    return (
        <div className="Conteiner7Scrolldados6">
            <div className="Conteiner7Scrolldados6Icone">
                <img src={IMAGE} alt="" />
            </div>
            <div className="Conteiner7Scrolldados6Cont">
                <b> {dados.nome_remetente} </b>
                <li>{dados.mensagem} <b> {dados.nome_Turma} </b></li>
                <div className="Conteiner7ScrollDados6ContBtn">
                    <button onClick={()=>{Conteiner7ScrollDadosRecusarConvite(dados.id_turma_convite , dadosUsuario?.id)}}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-trash-fill" viewBox="0 0 16 16">
                        <path d="M2.5 1a1 1 0 0 0-1 1v1a1 1 0 0 0 1 1H3v9a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V4h.5a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1H10a1 1 0 0 0-1-1H7a1 1 0 0 0-1 1zm3 4a.5.5 0 0 1 .5.5v7a.5.5 0 0 1-1 0v-7a.5.5 0 0 1 .5-.5M8 5a.5.5 0 0 1 .5.5v7a.5.5 0 0 1-1 0v-7A.5.5 0 0 1 8 5m3 .5v7a.5.5 0 0 1-1 0v-7a.5.5 0 0 1 1 0"/>
                        </svg>
                        Recusar
                    </button>
                    <button onClick={aceitarConviteOuSolicitacao}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-stack" viewBox="0 0 16 16">
                        <path d="m14.12 10.163 1.715.858c.22.11.22.424 0 .534L8.267 15.34a.6.6 0 0 1-.534 0L.165 11.555a.299.299 0 0 1 0-.534l1.716-.858 5.317 2.659c.505.252 1.1.252 1.604 0l5.317-2.66zM7.733.063a.6.6 0 0 1 .534 0l7.568 3.784a.3.3 0 0 1 0 .535L8.267 8.165a.6.6 0 0 1-.534 0L.165 4.382a.299.299 0 0 1 0-.535z"/>
                        <path d="m14.12 6.576 1.715.858c.22.11.22.424 0 .534l-7.568 3.784a.6.6 0 0 1-.534 0L.165 7.968a.299.299 0 0 1 0-.534l1.716-.858 5.317 2.659c.505.252 1.1.252 1.604 0z"/>
                        </svg>
                        Aceitar
                    </button>
                </div>
            </div>
        </div>
    )
}