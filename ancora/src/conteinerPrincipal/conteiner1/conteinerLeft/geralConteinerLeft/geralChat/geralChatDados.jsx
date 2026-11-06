import { useState } from "react";
import "../css/GeralChatDados.css"
import { DadosActive } from "../js/geralChatDadosAction";
import { useUserStore } from "../../../../../useUseSotore";
import Erro from "../../../../components/conteinerSvg/erro"
import { TrancarConversaUsuario } from "../js/TrancarConversaUsuario";
import { Bloquear_Usuario } from "../js/bloquear_amigo";
import { Exluir_Amigo } from "../js/Excluir_amigo";
import Perfil from "../../../../../assets/img_fundo_vazio/perfil.png"
import { tipoPreviaMensagem } from "../../../../../utils/mensagemPreview";
export default function GeralChatDados ({dados, quantidade_menssagem_lida}) {
    const tipoPrevia = tipoPreviaMensagem(dados?.ultima_menssagem);
 
    // REMOVIDO: socket daqui
    const { 
        setChatAtivo, 
        dadosUsuario, 
        ChatAtivo, 
        setMenssagemLida, 
        setProdutoUsuarioChat, 
        setMostrarChat , 
        urlBancoDeDados ,
        setEstadoMenuMobila,
        setMostrarConteinerAgenda,
        setMostrarConteinerUsuarioConvite,
        setEstadoConteinerAdicionarVideo,
        Negritar , 
        setActualizarEstadoPrivado , 
        setActualizarUsuarioBloqueado , 
        setActualizarUsuarioExluido , 
        set_Tipo_Chat_Turma
    } = useUserStore()
    const [mostrarMenuConfiguracao, setMostrarMenuConfiguracao] = useState(false)

    const condicao_estado_user = (id_amigo , estado_privado_usuario , estado_bloqueado_usuario , estado_excluido_usuario , telefone_amigo) =>{
        const Telfone_usuario = `+244:${telefone_amigo}`
        switch(mostrarMenuConfiguracao){
            case true:
                const nome_paraEmplementar = estado_privado_usuario === false ? "Trancar":"Destrancar"
                const nome_bloqueado_para_emplementar = estado_bloqueado_usuario === false ? "Bloquear":"Desbloquear"
                return(
                        <div className="conteiner_menu_configuracao_condicao_usuario">
                            <li onClick={()=>{TrancarConversaUsuario(id_amigo , estado_privado_usuario ,  setActualizarEstadoPrivado , setMostrarMenuConfiguracao)}}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-incognito" viewBox="0 0 16 16">
                                <path fill-rule="evenodd" d="m4.736 1.968-.892 3.269-.014.058C2.113 5.568 1 6.006 1 6.5 1 7.328 4.134 8 8 8s7-.672 7-1.5c0-.494-1.113-.932-2.83-1.205l-.014-.058-.892-3.27c-.146-.533-.698-.849-1.239-.734C9.411 1.363 8.62 1.5 8 1.5s-1.411-.136-2.025-.267c-.541-.115-1.093.2-1.239.735m.015 3.867a.25.25 0 0 1 .274-.224c.9.092 1.91.143 2.975.143a30 30 0 0 0 2.975-.143.25.25 0 0 1 .05.498c-.918.093-1.944.145-3.025.145s-2.107-.052-3.025-.145a.25.25 0 0 1-.224-.274M3.5 10h2a.5.5 0 0 1 .5.5v1a1.5 1.5 0 0 1-3 0v-1a.5.5 0 0 1 .5-.5m-1.5.5q.001-.264.085-.5H2a.5.5 0 0 1 0-1h3.5a1.5 1.5 0 0 1 1.488 1.312 3.5 3.5 0 0 1 2.024 0A1.5 1.5 0 0 1 10.5 9H14a.5.5 0 0 1 0 1h-.085q.084.236.085.5v1a2.5 2.5 0 0 1-5 0v-.14l-.21-.07a2.5 2.5 0 0 0-1.58 0l-.21.07v.14a2.5 2.5 0 0 1-5 0zm8.5-.5h2a.5.5 0 0 1 .5.5v1a1.5 1.5 0 0 1-3 0v-1a.5.5 0 0 1 .5-.5"/>
                                </svg>
                                {nome_paraEmplementar}
                            </li>
                            <li onClick={()=>{Bloquear_Usuario(id_amigo , estado_bloqueado_usuario , setActualizarUsuarioBloqueado , setMostrarMenuConfiguracao )}}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-sim-slash-fill" viewBox="0 0 16 16">
                                <path d="m11.646.44.897.896-1.703 1.703A1.5 1.5 0 0 0 10.5 3h-5A1.5 1.5 0 0 0 4 4.5v5.379l-2 2V1.5A1.5 1.5 0 0 1 3.5 0h7.086a1.5 1.5 0 0 1 1.06.44M8.5 5.378 9.879 4H8.5zM5 8.879 6.879 7H5zm6-1.758L9.121 9H11zm-3.5 3.5L6.121 12H7.5zM5.5 13q-.175 0-.34-.039L2.502 15.62c.265.236.615.38.998.38h9a1.5 1.5 0 0 0 1.5-1.5V4.121l-2 2V11.5a1.5 1.5 0 0 1-1.5 1.5zM5 4.5a.5.5 0 0 1 .5-.5h2v2H5zM8.5 10H11v1.5a.5.5 0 0 1-.5.5h-2zm6.354-8.146a.5.5 0 0 0-.708-.708l-13 13a.5.5 0 0 0 .708.708z"/>
                                </svg>
                                {nome_bloqueado_para_emplementar}

                            </li>
                            <li onClick={()=>{Exluir_Amigo(id_amigo , estado_excluido_usuario , setActualizarUsuarioExluido , setMostrarMenuConfiguracao )}}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-trash3-fill" viewBox="0 0 16 16">
                                <path d="M11 1.5v1h3.5a.5.5 0 0 1 0 1h-.538l-.853 10.66A2 2 0 0 1 11.115 16h-6.23a2 2 0 0 1-1.994-1.84L2.038 3.5H1.5a.5.5 0 0 1 0-1H5v-1A1.5 1.5 0 0 1 6.5 0h3A1.5 1.5 0 0 1 11 1.5m-5 0v1h4v-1a.5.5 0 0 0-.5-.5h-3a.5.5 0 0 0-.5.5M4.5 5.029l.5 8.5a.5.5 0 1 0 .998-.06l-.5-8.5a.5.5 0 1 0-.998.06m6.53-.528a.5.5 0 0 0-.528.47l-.5 8.5a.5.5 0 0 0 .998.058l.5-8.5a.5.5 0 0 0-.47-.528M8 4.5a.5.5 0 0 0-.5.5v8.5a.5.5 0 0 0 1 0V5a.5.5 0 0 0-.5-.5"/>
                                </svg>
                                Excluir
                            </li>
                            <li>
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-exclamation-circle-fill" viewBox="0 0 16 16">
                                <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0M8 4a.905.905 0 0 0-.9.995l.35 3.507a.552.552 0 0 0 1.1 0l.35-3.507A.905.905 0 0 0 8 4m.002 6a1 1 0 1 0 0 2 1 1 0 0 0 0-2"/>
                                </svg>
                                Denunciar
                            </li>
                            <li>
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-telephone-fill" viewBox="0 0 16 16">
                                <path fill-rule="evenodd" d="M1.885.511a1.745 1.745 0 0 1 2.61.163L6.29 2.98c.329.423.445.974.315 1.494l-.547 2.19a.68.68 0 0 0 .178.643l2.457 2.457a.68.68 0 0 0 .644.178l2.189-.547a1.75 1.75 0 0 1 1.494.315l2.306 1.794c.829.645.905 1.87.163 2.611l-1.034 1.034c-.74.74-1.846 1.065-2.877.702a18.6 18.6 0 0 1-7.01-4.42 18.6 18.6 0 0 1-4.42-7.009c-.362-1.03-.037-2.137.703-2.877z"/>
                                </svg>
                                <a href={Telfone_usuario}>Ligar</a>
                                
                            </li>
                            <li onClick={()=>{setMostrarMenuConfiguracao(false)}}>
                                <Erro />
                                Sair
                            </li>

                        </div>

                )
        }
    }
    let valor = "none"
    if(dados.foto_amigo !== "none"){
        valor = "ativo"
    }
    const getUrlVideo = (url) => {
      if (!url) return "";
        // Verifica se a URL já começa com http ou https
        const isUrlCompleta = url.startsWith("http://") || url.startsWith("https://");
        
        return isUrlCompleta ? url : `${urlBancoDeDados}/${url}`;
      };

    const [estadoFotoPerfil , setEstadoFotoPerfil] = useState(valor)
    const condicao_estado_perfil = ()=>{
        switch(estadoFotoPerfil){
            case "none":
                return (
                    <div className="PerfilPadrao">
                        <img src={Perfil} alt="" />
                    </div>
                )
            case "ativo":
                const URLIMAGE = `${getUrlVideo(dados.foto_amigo)}`
                return (
                    <div className="GeralChatDadosIconeValueBox">
                        <img src={URLIMAGE} alt="" />
                    </div>
                )
        }
    }
    const iniciais = dados?.nome
       ? dados.nome.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase()
        : "??";

    const gerarGradienteElegante = (id) => {
        const coresBase = [
            ["#11cb7e", "#25fcee"], ["#9aceff", "#cffedb"],
            ["#00b09b", "#067b7f"], ["#00b3ff", "#49d4a3"]
        ];
        const parDeCores = coresBase[id % coresBase.length];
        return `linear-gradient(135deg, ${parDeCores[0]}, ${parDeCores[1]})`;
    };

    const meuGradiente = gerarGradienteElegante(dados.id_amigo);

    const entrarNaSala = (e) => {
        const socketAtual = useUserStore.getState().socket // PEGA SOCKET AGORA
        setEstadoMenuMobila("normal")
        setMostrarConteinerAgenda(false)
        setMostrarConteinerUsuarioConvite(false)
        setEstadoConteinerAdicionarVideo(false)
        setMostrarMenuConfiguracao(false)
        if (!socketAtual?.connected) {
            console.log("❌ Socket não conectado ainda. Tentando reconectar...")
            useUserStore.getState().conectarSocket() // Força conectar
            alert("Conectando ao chat, tenta de novo em 1s")
            return
        }

        console.log("✅ Entrando na sala com socket:", socketAtual.id)
        DadosActive(
            e,
            dados.nome,
            dados.id_amigo,
            dados.nossa_sala,
            dados.foto_amigo,
            setChatAtivo,
            socketAtual, // USA O SOCKET FRESCO
            dadosUsuario.id,
            dadosUsuario.nome,
            dadosUsuario.foto_usuario,
            ChatAtivo?.nossa_sala,
            setMenssagemLida,
            setProdutoUsuarioChat,
            setMostrarChat,
            
        )
    }
    let classeQuantidadeMenssagemLida = `GeralChatDadosObjectNewMenssage sala_${dados.nossa_sala}`
    let idHoraMenssagem = `hora_mensagem_${dados.nossa_sala}`
    let index = `index_${dados.nossa_sala}`

    return (
        <div className="GeralChatDados" id={index}>
            <div className="GeralChatDadosIcone">
                <div className="GeralChatDadosIconeValue">
                    {condicao_estado_perfil()}
                    <div className="pontoPonto"></div>
                </div>
            </div>
            <div className="GeralChatDadosTexto" onClick={(event) => {
                set_Tipo_Chat_Turma(false);
                entrarNaSala(event);
            }}>
                <b>{dados.nome}</b>
                <div className="formatarTextoLinewMenssage">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                    <span class="nav-badge" id="chat-badge"></span>
                    <li
                        id={dados.nossa_sala}
                        className={dados.nossa_sala}
                        style={{
                            color: quantidade_menssagem_lida !== 0 ? "var(--text-primary)" : "var(--text-secondary)",
                            fontWeight: quantidade_menssagem_lida !== 0 ? "bold" : "500"
                        }}
                    >
                        {tipoPrevia ? (
                            <span className="preview-multimedia-mensagem">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                    {tipoPrevia === "audio" ? (
                                        <>
                                            <path d="M11 5 6 9H3v6h3l5 4V5Z" />
                                            <path d="M15.5 8.5a5 5 0 0 1 0 7" />
                                            <path d="M19 5a10 10 0 0 1 0 14" />
                                        </>
                                    ) : tipoPrevia === "imagem" ? (
                                        <>
                                            <rect x="3" y="3" width="18" height="18" rx="2" />
                                            <circle cx="8.5" cy="8.5" r="1.5" />
                                            <path d="m21 15-5-5L5 21" />
                                        </>
                                    ) : (
                                        <>
                                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                            <path d="M14 2v6h6M8 13h8M8 17h8" />
                                        </>
                                    )}
                                </svg>
                                <span>
                                    {tipoPrevia === "audio" ? "Áudio" : tipoPrevia === "imagem" ? "Imagem" : "Ficheiro"}
                                </span>
                            </span>
                        ) : dados.ultima_menssagem}
                    </li>
                </div>
            </div>


            <div className="GeralChatDadosObject">
                <h5 id={idHoraMenssagem}>{dados.HoraMenssagem}</h5>
                {quantidade_menssagem_lida!== 0 && (
                    <div className="GeralChatDadosObjectNewMenssage" id= {classeQuantidadeMenssagemLida} >
                        {quantidade_menssagem_lida}
                    </div>
                )}
                <li className="MenuMobileSvg" onClick={() => setMostrarMenuConfiguracao((aberto) => !aberto)}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-chevron-compact-down" viewBox="0 0 16 16">
                    <path fill-rule="evenodd" d="M1.553 6.776a.5.5 0 0 1 .67-.223L8 9.44l5.776-2.888a.5.5 0 1 1 .448.894l-6 3a.5.5 0 0 1-.448 0l-6-3a.5.5 0 0 1-.223-.67"/>
                    </svg>
                </li>
                {condicao_estado_user(dados.id_amigo , dados.estado_privado_usuario , dados.estado_bloqueado_usuario , dados.estado_excluido_usuario , dados.telefone_amigo)}
            </div>
        </div>
    )
}