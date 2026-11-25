import "./css/ConteinerRightDadosWindowMensageEle.css"
import { useUserStore } from "../../../useUseSotore";
import Perfil from "../../../assets/img_fundo_vazio/perfil.png"
import { Selecionar_menssagem } from "./js/conteinerRightDadosMenssage";
import { TirarSelecao } from "./js/TirarSelecao";
export default function ConteinerRightDadosWindowMenssageEle ({texto , hora , nome , fundo , id , nossa_sala , id_remitente, foto_amigo, mensagemOriginal, nomeOriginal, isAssistant = false}) {
    const iniciais = nome 
    ? nome.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase() 
    : "??";

    const {urlBancoDeDados , Tipo_Chat_Turma , setIdMenssagem} = useUserStore()
    const fotoPerfil = typeof foto_amigo === "string" ? foto_amigo.trim() : "";
    const temFotoPerfil = Boolean(
        fotoPerfil
        && fotoPerfil.toLowerCase() !== "none"
        && !fotoPerfil.toLowerCase().endsWith("/none")
    );

    const condicao_mostrar_nome_amigo_turma = ()=>{
        switch(Tipo_Chat_Turma){
            case true:
                return(
                    <b>{nome}</b>
                )
        }
    }

    const getUrlVideo = (url) => {
      if (!url) return "";
        // Verifica se a URL já começa com http ou https
        const isUrlCompleta = url.startsWith("http://")
            || url.startsWith("https://")
            || url.startsWith("/assets/")
            || url.startsWith("/src/assets/")
            || url.startsWith("data:");

        return isUrlCompleta ? url : `${urlBancoDeDados}/${url.replace(/^\/+/, "")}`;
      };

    return (
        <div className="conteiner_block_mensage_chat" >
            <div className={`ConteinerRightDadosWindowMensageEle${isAssistant ? " assistantResponse" : ""}`} onDoubleClick={(e) => Selecionar_menssagem(e , id , nossa_sala, id_remitente, setIdMenssagem)} onClick={TirarSelecao}>
                
                <div className="iconeUserEle">
                    <div className={`iconeUserEleIcone${temFotoPerfil ? "" : " IconePerfilElePadrao"}`}>
                        <img
                            src={temFotoPerfil ? getUrlVideo(fotoPerfil) : Perfil}
                            alt={temFotoPerfil ? (isAssistant ? "Logótipo da Âncora" : "Foto de perfil") : "Imagem de perfil padrão"}
                            onError={(event) => {
                                event.currentTarget.onerror = null;
                                event.currentTarget.src = Perfil;
                            }}
                        />
                    </div>
                </div>
                <div className="textoUserEle">
                    {condicao_mostrar_nome_amigo_turma()}
                    {mensagemOriginal && (
                        <div className="responder_menssagem_usuarioEle">
                            <h3>Eu</h3>
                            <em>{mensagemOriginal}</em>
                        </div>
                    )}
                    <li> {texto} </li>
                </div>
            </div>
            <span> {hora} </span>
        </div>

    )
}