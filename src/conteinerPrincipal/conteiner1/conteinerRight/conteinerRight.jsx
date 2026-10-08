import { useState, useEffect } from "react";
import "./css/conteinerRight.css";
import ConteinerRightMenuTop from "./conteinerRightMenuTop";
import ConteinerRightWindowMenssage from "./conteinerRightWindowMenssage";
import ConteinerRightMenuBottom from "./ConteinerRightMenuBottom";
import { useUserStore } from "../../../useUseSotore";
import Logo from "../../../assets/img1.jpg";

export default function ConteinerRight({ ativarConteiner }) {
    const { ChatAtivo , MostrarChat} = useUserStore();
    const [isMobile, setIsMobile] = useState(false);

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
                <img src={Logo} alt="" />
            </div>
        );
    }

    return (
        <div className={`conteinerRight ${isMobile && !MostrarChat? 'tirarConteinerRight' : ''}`}>
            <ConteinerRightMenuTop ativarConteiner={ativarConteiner} />
            <ConteinerRightWindowMenssage />
            <ConteinerRightMenuBottom />
        </div>
    );
}