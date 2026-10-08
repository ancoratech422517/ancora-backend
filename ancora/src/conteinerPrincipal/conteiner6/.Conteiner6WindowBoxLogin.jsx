import { useState } from "react";
import { useUserStore } from "../../useUseSotore";
import "./css/Conteiner6WindowBoxLogin.css"
import Logo from "../../assets/logo2.png"
import { Login } from "./js/Conteiner6WindowBoxLogin";
import { SwitchTab } from "./js/Conteiner6WindowBoxLogin";
import { Registro } from "./js/Conteiner6WindowBoxRegistro";
import Loading3 from "../components/conteinerComponentesJsx/loading3";
import Erro from "../components/conteinerSvg/erro";
export default function Conteiner6WindowBoxLogin ({ ativarConteiner, setConta}) {
    const setDados = useUserStore((state)=> state.setDados)
    
    const [carregando, setCarregando] = useState(false)
    const [erro , setErro] = useState("False")
    const condicaoErro  = ()=>{
        switch(erro){
            case "True":
                return (
                         
                        <div className="Menssagem-log">
                            <Erro />  Erro. credencias invalidas
                        </div>
                    
                )
        }
    }
    
    const handleLogin = async () => {
        if (carregando) return
        setCarregando(true)
        await Login(ativarConteiner, setDados , setEstadoLoading , setErro)
        setCarregando(false)
    }

    const [estadoLoading , setEstadoLoading] = useState("False")
    const condicaoEstadoLoading = ()=>{
        switch(estadoLoading){
            case "True":
                return (
                    <div className="LoadingFormAtivo">
                        <Loading3 />
                    </div>
                )
        }
    }
    
    return (

                <div className="container_form">
                    {condicaoEstadoLoading()}
                    {condicaoErro()}
                    <div className="Conteiner_form_Icone_ancora">
                        <img src={Logo} alt="" />
                    </div>
                    <div className="logo">
                        <h1>Bem-vindo</h1>
                        <p>Acesse sua conta ou crie uma nova</p>
                    </div>

                    <div className="tabs">
                        <button className="tab active" onClick={()=> SwitchTab("login")}>Entrar</button>
                        <button className="tab" onClick={()=>SwitchTab("register")}>Cadastrar</button>
                    </div>

                    {/* <!-- FORM LOGIN --> */}
                    <form className="form active" id="login-form">

                        <div className="input-group">
                            <label for="login-email">Telefone</label>
                            <div className="input-wrapper">
                                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 0 01-4.5 1.207"/>
                                </svg>
                                <input type="Tel" id="TerminalLogin" className="form-input" placeholder="Digite seu Terminal" required />
                            </div>
                        </div>

                        <div className="input-group">
                            <label for="login-password">Senha</label>
                            <div className="input-wrapper">
                                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
                                </svg>
                                <input type="password" id="SenhaLogin" className="form-input" placeholder="••••••••" required />
                            </div>
                        </div>

                        <div className="form-options">
                            <label className="checkbox">
                                <input type="checkbox" />
                                Lembrar de mim
                            </label>
                            <a href="#" className="link">Esqueceu a senha?</a>
                        </div>

                        <button type="submit" className="btn-submit" onClick={handleLogin} disabled={carregando}>Entrar na conta</button>
                    </form>

                    {/* <!-- FORM REGISTRO --> */}
                    <form className="form" id="register-form">
                        <div className="avatar-upload">
                            <div className="avatar-wrapper">
                                <label for="avatar-input" className="avatar-preview" id="avatar-preview">
                                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                                    </svg>
                                </label>
                                <input type="file" id="avatar-input" className="avatar-input" accept="image/*" />
                                <label for="avatar-input" className="avatar-edit">
                                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
                                    </svg>
                                </label>
                            </div>
                        </div>

                        <div className="input-group">
                            <label for="register-name">Nome completo</label>
                            <div className="input-wrapper">
                                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                                </svg>
                                <input type="text" id="register-name" className="form-input" placeholder="João Silva" required/>
                            </div>
                        </div>

                        <div className="input-group">
                            <label for="register-email">E-mail</label>
                            <div className="input-wrapper">
                                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 0 01-4.5 1.207"/>
                                </svg>
                                <input type="email" id="register-email" className="form-input" placeholder="seu@email.com" required />
                            </div>
                        </div>

                        <div className="input-row">
                            <div className="input-group">
                                <label for="register-phone">Telefone</label>
                                <div className="input-wrapper">
                                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/>
                                    </svg>
                                    <input type="tel" id="register-phone" className="form-input" placeholder="999-999-999" required/>
                                </div>
                            </div>

                            <div className="input-group">
                                <label for="register-birth">Nascimento</label>
                                <div className="input-wrapper">
                                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                                    </svg>
                                    <input type="date" id="register-birth" className="form-input" required/>
                                </div>
                            </div>
                        </div>

                        <div className="input-row">
                            <div className="input-group">
                                <label for="register-password">Senha</label>
                                <div className="input-wrapper">
                                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
                                    </svg>
                                    <input type="password"  id="register-password" className="form-input" placeholder="Min 8 caracteres" />
                                    {/* <input type="password" id="register-password" classNameName="form-input" placeholder="Min 8 caracteres"> */}
                                </div>
                            </div>
                        

                            <div className="input-group">
                                <label for="register-confirm">Confirmar</label>
                                <div className="input-wrapper">
                                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                                    </svg>
                                    <input type="password" id="register-confirm" className="form-input" placeholder="Repita a senha" required  />
                                    {/* <input type="password" id="register-confirm" classNameName="form-input" placeholder="Repita a senha" required> */}
                                </div>
                            </div>
                        </div>

                        <button type="submit" className="btn-submit" onClick={()=>Registro(setEstadoLoading)}>Criar conta</button>

                        <p className="terms">
                            Ao criar uma conta, você concorda com nossos
                            <a href="#" className="link">Termos</a> e
                            <a href="#" className="link">Privacidade</a>
                        </p>
                    </form>
                </div>

            
    )
}