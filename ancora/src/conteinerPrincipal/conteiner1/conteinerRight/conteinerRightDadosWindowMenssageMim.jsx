import "./css/ConteinerRightDadosWindowMenssageMim.css"
import { Selecionar_menssagem } from "./js/conteinerRightDadosMenssage";
import { useUserStore } from "../../../useUseSotore";
import { TirarSelecao } from "./js/TirarSelecao";
import Perfil from "../../../assets/img_fundo_vazio/perfil.png"
export default function ConteinerRightDadosWindowMenssageMim ({texto , hora , nome , fundo , id , nossa_sala , id_remitente , foto_usuario, mensagemOriginal, nomeOriginal}) {
    const {socket , urlBancoDeDados} = useUserStore()
    const {setIdMenssagem} = useUserStore()
    const fotoPerfil = typeof foto_usuario === "string" ? foto_usuario.trim() : "";
    const temFotoPerfil = Boolean(
        fotoPerfil
        && fotoPerfil.toLowerCase() !== "none"
        && !fotoPerfil.toLowerCase().endsWith("/none")
    );
    const imagemPerfil = temFotoPerfil
        ? (fotoPerfil.startsWith("http://") || fotoPerfil.startsWith("https://") || fotoPerfil.startsWith("data:")
            ? fotoPerfil
            : fotoPerfil.startsWith("/assets/") || fotoPerfil.startsWith("/src/assets/")
                ? fotoPerfil
                : `${urlBancoDeDados}/${fotoPerfil.replace(/^\/+/, "")}`)
        : Perfil;
    const iniciais = nome 
        ? nome.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase() 
        : "??";
    return (
        <div className="ConteinerRightDadosWindowMenssageMim" onDoubleClick={(e) => Selecionar_menssagem(e , id , nossa_sala, id_remitente, setIdMenssagem)} onClick={TirarSelecao}>

            <div className="ConteinerRightDadosWindowMenssageMimControls">
                    <div className="conteiner_block_mensage_chat">
                        <div className="Conteiner_displayFlex">

                            <div className="textoUserMim">
                            {mensagemOriginal && (
                                <div className="responder_menssagem_usuario">
                                    <h3>{nomeOriginal}</h3>
                                    <em>{mensagemOriginal}</em>
                                </div>
                            )}
                                    
                                <li id={id}>{texto}</li>
                                
                            </div>
                            <div className="IconeUserMim">
                                <div className={`IconeUserMimIcone${temFotoPerfil ? "" : " IconePerfilElePadrao"}`}>
                                    <img
                                        src={imagemPerfil}
                                        alt={temFotoPerfil ? "Foto de perfil do utilizador" : "Imagem de perfil padrão"}
                                        onError={(event) => {
                                            event.currentTarget.onerror = null;
                                            event.currentTarget.src = Perfil;
                                        }}
                                    />
                                </div>
                            </div>
                        </div>
                        <span className="horaMim"> {hora} </span>
                    </div>

            </div>

            
        </div>
        
    )
}
