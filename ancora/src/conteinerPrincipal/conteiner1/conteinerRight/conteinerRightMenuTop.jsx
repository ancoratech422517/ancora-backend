import { useState } from "react";
import "./css/ConteinerRightMenuTop.css";
import SetaEsquerda from "../../components/conteinerSvg/setaEsquerda";
import Telefone from "../../components/conteinerSvg/Telefone";
import Store from "../../components/conteinerSvg/store";
import MenuPonto from "../../components/conteinerSvg/menuPonto";
import { useUserStore } from "../../../useUseSotore";
import { Back_home } from "./js/conteinerRightMenuTopAction";
import { MenuMobileRight } from "./js/menuMobile";
import Perfil from "../../../assets/img_fundo_vazio/perfil.png"
export default function ConteinerRightMenuTop({ativarConteiner}) {
    // 1. Pegamos ChatAtivo, socket, o array de amigos e o novo estado digitandoStatus
    const { 
        ChatAtivo, 
        socket, 
        amigos, 
        digitandoStatus , 
        setMostrarChat , 
        urlBancoDeDados , 
        setIsMobile
    } = useUserStore();

    // 2. Buscamos o status atualizado diretamente no array de amigos
    const amigoNoEstado = amigos.find(
        (a) => String(a.id_amigo) === String(ChatAtivo?.id_amigo)
    );
    let valor = "none"
    
    const retorno = ()=>{
        if (ChatAtivo?.foto_amigo !== "none"){
            return "ativo"
        }
        else{
            return "none"
        }
    }
    
    const [estadoFotoPerfil , setEstadoFotoPerfil] = useState(retorno())
    const getUrlVideo = (url) => {
      if (!url) return "";
        // Verifica se a URL já começa com http ou https
        const isUrlCompleta = url.startsWith("http://") || url.startsWith("https://");
        
        return isUrlCompleta ? url : `${urlBancoDeDados}/${url}`;
      };

    const estadoFotoPerfilUser = ()=>{
        switch(estadoFotoPerfil){
            case "none":
                return (
                       <div className="ConteinerRightMenuTopBoxLeftCaxa2Icone IconePerfilPadraoMenuTop">
                            <img src={Perfil} alt="" />
                        </div>
                )
            break
            case "ativo":
                const URLIMAGE = `${getUrlVideo(ChatAtivo?.foto_amigo)}`
                if (URLIMAGE === `${urlBancoDeDados}`){
                    return (
                        <div className="ConteinerRightMenuTopBoxLeftCaxa2Icone IconePerfilPadraoMenuTop">
                            <img src={Perfil} alt="" />
                        </div>
                    )
                }
                return (
                    <div className="ConteinerRightMenuTopBoxLeftCaxa2Icone">
                        <img src={URLIMAGE} alt="" />
                    </div>
                )
            break
        }
    }
    

    // 3. Verificamos se este amigo específico está digitando para nós
    const estaDigitando = digitandoStatus[ChatAtivo?.id_amigo];

    // 4. Definimos o status de conexão.
    const statusAtual = amigoNoEstado?.status || "online";

    // Proteção caso o componente tente renderizar sem um chat selecionado
    if (!ChatAtivo) return null;

    
    return (
        <div className="ConteinerRightMenuTop">
            <div className="ConteinerRightMenuTopBoxLeft">
                <div 
                    className="ConteinerRightMenuTopBoxLeftCaxa1" 
                    onClick={() => Back_home(socket, ChatAtivo.nossa_sala, setMostrarChat , setIsMobile)}
                >
                    <SetaEsquerda ativarConteiner = {ativarConteiner} />
                </div>
                
                <div className="ConteinerRightMenuTopBoxLeftCaxa2">
                    {/* Exibe as iniciais do nome */}
                    {estadoFotoPerfilUser()}
                </div>
                
                <div className="ConteinerRightMenuTopBoxLeftCaxa3">
                    <b> {ChatAtivo.nome_amigo} </b>
                    
                    {/* LÓGICA DINÂMICA: Prioridade para 'Digitando', depois Status de conexão */}
                    {estaDigitando ? (
                        <li style={{ 
                            color: 'var(--status-online)',
                            listStyle: 'none', 
                            fontSize: '12px', 
                            fontWeight: '600',
                            fontStyle: 'italic'
                        }}>
                            Digitando...
                        </li>
                    ) : (
                        <li style={{ 
                            color: statusAtual === 'online' ? 'var(--status-online)' : 'var(--text-muted)',
                            listStyle: 'none',
                            fontSize: '13px',
                            fontWeight: '500'
                        }}>
                            {statusAtual === 'online' ? 'Online' : 'Offline'}
                        </li>
                    )}
                </div>
            </div>

            <div className="ConteinerRightMenuTopBoxRight">
                <div className="ConteinerRightMenuTopBoxRightCaxa" onClick={ ()=> MenuMobileRight(setMostrarChat)}>
                    <Store />
                </div>
                <div className="ConteinerRightMenuTopBoxRightCaxa">
                    <Telefone />
                </div>
            </div>
        </div>
    );
}