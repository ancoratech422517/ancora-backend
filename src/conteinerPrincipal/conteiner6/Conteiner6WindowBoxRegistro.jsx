import { useState } from "react";
import "./css/Conteiner6WindwBoxRegistro.css"
import LogoRegistro from "../../assets/logo2.png"
import { Registro } from "./js/Conteiner6WindowBoxRegistro";
import Loading from "../components/conteinerComponentesJsx/loading";
export default function Conteiner6WindowBoxRegistro ({setConta}) {
    const [loading , setLoading] = useState("False")
    const loagind_buttom = ()=>{
        switch(loading){
            case "False":
                return "Register"
            case "True":
                return <Loading />
            default:
                return "Register"
        }
    }
    const [responseUser , setResponseUser] = useState("False")
    const ationResp = ()=>{
        switch (responseUser){
            case "False":
                return
            case "True":
                return (
                        <div className="dados_response" id="response">
                            
                      </div>
                )
            default:
                return
        }
    }
    return (
        <div className="Conteiner6WindwBoxRegistro">
            <div className="response">
                {ationResp()}
            </div>
            <div className="Conteiner6WindowBoxRegistroIcone">
                <div className="boxRegistroIcone">
                    <img src={LogoRegistro} alt="" />
                </div>
            </div>
            <h2>Register</h2>
            <input type="text" placeholder="Digite seu nome completo" id="nome" />
            <input type="text" placeholder="Digite seu Terminal" id="telefone"/>
            <input type="password" placeholder="Digite sua senha" id="senha" />
            <input type="password" placeholder="Confirmar senha" id="confirmar_senha" />
            <button onClick={()=> {Registro() ;} }> {loagind_buttom()} </button>
            <b onClick={()=> setConta("Login")}>voltar ao login</b>
        </div>
    )
}



