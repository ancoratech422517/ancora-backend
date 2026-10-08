import { useState, useEffect } from "react";
import "./css/conteinerRight.css";
import ConteinerRightMenuTop from "./conteinerRightMenuTop";
import ConteinerRightWindowMenssage from "./conteinerRightWindowMenssage";
import ConteinerRightMenuBottom from "./ConteinerRightMenuBottom";
import { useUserStore } from "../../../useUseSotore";
import ConteinerRightLive from "./ConteinerRightLive.jsx";
import IMGPERFIL from "../../../assets/IMGPERFIL.png";
import CHAT from "../../../assets/chat.png"
import Notificacao from "../../../assets/notificacao.png";
import Loja from "../../../assets/loja.png";
import CursoVideo from "../../../assets/cursoVideo.png";

export default function ConteinerRight({ ativarConteiner }) {
    const { ChatAtivo , MostrarChat , estado_conteiner_live , Dados_Live_Ancora} = useUserStore();
    const [isMobile, setIsMobile] = useState(false);
    //alert(Dados_Live_Ancora.sala_Turma)

    useEffect(() => {
        const checkScreenSize = () => {
            setIsMobile(window.innerWidth <= 880);
        };

        checkScreenSize(); // executa imediatamente

        window.addEventListener('resize', checkScreenSize);

        return () => {
            window.removeEventListener('resize', checkScreenSize);
        };
    }, []);

    if (!ChatAtivo) {
        return (
            <div className="ConteinerRightInicial">
             <div className="ConteinerRightInicialPerfilAncora">
                <img src={IMGPERFIL} alt="Perfil do usuário" />
             </div>
             <h1>Âncora Ecommerce</h1>
             <p>Sejá bem vindo a nossa plataforma Only One , e encontre os melhores produtos ou cursos possíveis!</p>
             <div className="ConteinerRightInicialBoxs">
                <div className="ConeinerRightInicialBoxsCaxa">
                    <div className="ConeinerRightInicialBoxsCaxaIcone">
                        <img src={CHAT} alt="Icone de chat" />
                    </div>
                    <h3>Conversas</h3>
                </div>
                <div className="ConeinerRightInicialBoxsCaxa">
                    <div className="ConeinerRightInicialBoxsCaxaIcone">
                        <img src={Notificacao} alt="Icone de notificações" />
                    </div>
                    <h3>Notificações</h3>
                </div>
                <div className="ConeinerRightInicialBoxsCaxa">
                    <div className="ConeinerRightInicialBoxsCaxaIcone">
                        <img src={Loja} alt="Icone de loja" />
                    </div>
                    <h3>Loja</h3>
                </div>
                <div className="ConeinerRightInicialBoxsCaxa">
                    <div className="ConeinerRightInicialBoxsCaxaIcone">
                        <img src={CursoVideo} alt="Icone de curso" />
                    </div>
                    <h3>Cursos</h3>
                </div>
             </div>
                
            </div>
        );
    }

    return (
        <div className={`conteinerRight ${isMobile && !MostrarChat? 'tirarConteinerRight' : ''}`}>
            {/* <div className="ConteinerRightVideo">
                <video src={Video_Chat} autoPlay muted loop controls></video>
            </div> */}
            <div className="ConeinerRightConteudo">
                <ConteinerRightMenuTop ativarConteiner={ativarConteiner} />
                <ConteinerRightWindowMenssage />
                <ConteinerRightMenuBottom />

            </div>
        </div>
    );
}