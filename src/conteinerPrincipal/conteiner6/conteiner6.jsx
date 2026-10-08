import { useState } from "react";
import "./css/Conteiner6.css"
import FundoLogin from "../../assets/fundoLogin4.png"
import Conteiner6WindowBoxLogin from "./.Conteiner6WindowBoxLogin";
import Conteiner6WindowBoxRegistro from "./Conteiner6WindowBoxRegistro";
import Video from "../../assets/video2.webm"
export default function Conteiner6 ({ativarConteiner}) {
    const [conta , setConta] = useState("Login")
    const autentificaçã = () =>{
        switch(conta){
            case "Login":
                return <Conteiner6WindowBoxLogin ativarConteiner={ativarConteiner} setConta={setConta} />
            case "Registro":
                return <Conteiner6WindowBoxRegistro setConta={setConta} />
            default: 
                return <Conteiner6WindowBoxLogin setConta={setConta} />
        }
    }
    return (
        <div className="Conteiner6">
            <div className="Conteiner6Window">
                <div className="Conteiner6WindowBox">
                    {/* <img src={FundoLogin} alt="" /> */}
                    <video src={Video} autoPlay loop muted playsInline></video>
                </div>
                <div className="Conteiner6WindowBox">
                    {autentificaçã()}
                </div>
            </div>
        </div>
    )
}
