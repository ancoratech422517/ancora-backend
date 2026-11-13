import { useState } from "react";
import "./css/Conteiner5WindowConteinerLeft.css"
import { useUserStore } from "../../useUseSotore";
import Editar from "../components/conteinerSvg/editar";
import Logo from "../../assets/logo2.png"
import Perfil from "../../assets/img_fundo_vazio/perfil.png"
import { Actualizar_foto_Perfil } from "./js/Conteiner5WindowConteinerRegistrarFoto";
import { Imagem_em_tempo_real } from "./js/imagem_tempo_real";
import { getInitialTheme, saveTheme } from "../../utils/theme";
import { ClicarButtom } from "../components/conteinerComponentsJs/buttonAction";
import Orders from "../components/conteinerSvg/orders";
export default function Conteiner5WindowConteinerLeft () {
        const {setMostrarContRightWindow5 , dadosUsuario , urlBancoDeDados, logout, setAtivar} = useUserStore()
        const [estadoFoto , setEstadoFoto] = useState("texto")
        const [valorFoto , setValorFoto] = useState("CA")
        const [darkMode, setDarkMode] = useState(() => getInitialTheme() === "dark")
        const alternarTema = () => {
            const theme = darkMode ? "light" : "dark"
            saveTheme(theme)
            setDarkMode(theme === "dark")
        }
        const getUrlVideo = (url) => {
        if (!url) return "";
            // Verifica se a URL já começa com http ou https
            const isUrlCompleta = url.startsWith("http://") || url.startsWith("https://");
            
            return isUrlCompleta ? url : `${urlBancoDeDados}/${url}`;
        };

        const fotoPerfilRegistrada = dadosUsuario?.foto_usuario
        const temFotoPerfil = Boolean(
            fotoPerfilRegistrada &&
            fotoPerfilRegistrada !== "none" &&
            !fotoPerfilRegistrada.endsWith("/none")
        )
        const valor = temFotoPerfil ? "ativo" : "none"

        const [estado_escolha , setEstadoEscolha] = useState(valor)
        const estadoEscolhaPerfil = ()=>{
            switch(estado_escolha){
                case "none":
                    return (
                        <div className="contImagemActualizacao">
                            <img src={Perfil} alt="Perfil padrão do usuário" />
                        </div>
                    )
                case "ativo":
                    const urlImage = `${getUrlVideo(dadosUsuario.foto_usuario)}`
                    return (
                        <div className="contImagemActualizacao">
                            <img src={urlImage} alt="" />
                        </div>
                    )
            }
        }
        const actualizar_foto = ()=>{
            switch(estadoFoto){
                case "texto":
                    
                    return (
                        estadoEscolhaPerfil()
                    )
                case "image":
                    const urlImage = `${valorFoto}`
                    return (
                        <div className="contImagemActualizacao">
                            <img src={urlImage} alt="" />
                        </div>
                    )
            }
        }
    return (
        <div className="Conteiner5WindowConteinerLeft">
            <div className="Conteiner5WindowConteinerLeftScrollDados">
                <div className="Conteiner5WindowConteinerLeftMenuTop">
                    <h2>Perfil e Finanças</h2>
                    <li>Gerencie o seu perfil e controle os seus saques</li>
                </div>

                <div className="Conteiner5WindowConteinerLeftCenterCont">
                    <div className="Conteiner5WindowConteinerLeftCenterContImageUser">
                        {actualizar_foto()}
                        <input type="file" id="foto" style={{display:"none"}} onChange={()=> Actualizar_foto_Perfil(dadosUsuario.id , setEstadoFoto , setValorFoto)} />
                        <label className="labelEditar" htmlFor="foto"> <Editar /> </label>
                        
                    </div>
                    <h3> {dadosUsuario.nome} </h3>
                    <li>Ancora-commerce plantaforma digital</li>
                    <div className="Conteiner5WindowConteinerLeftNameEmpresa">
                        <b><span>★★★★★</span> - 4.7</b>
                        <li>Empresa-Ancora</li>
                    </div>
                    <button>Editar Perfil</button>
                    <button className="botaoTerminarSessao" type="button" onClick={() => void logout()}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5m5 5H3" />
                        </svg>
                        Terminar sessão
                    </button>
                </div>

                <div className="Conteiner5WindowConteinerLeftTema">
                    <div>
                        <strong>Aparência</strong>
                        <small>{darkMode ? "Tema escuro" : "Tema claro"}</small>
                    </div>
                    <button
                        type="button"
                        className="Conteiner5WindowConteinerLeftTemaToggle"
                        onClick={alternarTema}
                        aria-label={darkMode ? "Ativar tema claro" : "Ativar tema escuro"}
                        aria-pressed={darkMode}
                        title={darkMode ? "Ativar tema claro" : "Ativar tema escuro"}
                    >
                        <svg viewBox="0 0 24 24" aria-hidden="true">
                            {darkMode ? (
                                <>
                                    <circle cx="12" cy="12" r="4" />
                                    <path d="M12 2v2m0 16v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42" />
                                </>
                            ) : (
                                <path d="M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5Z" />
                            )}
                        </svg>
                    </button>
                </div>

                <button
                    type="button"
                    className="btn3 Conteiner5WindowConteinerLeftCRM"
                    onClick={(event) => void ClicarButtom(event, setAtivar, "conteiner3")}
                    aria-label="Abrir CRM"
                >
                    <span className="Conteiner5WindowConteinerLeftCRMIcon">
                        <Orders />
                    </span>
                    <span className="Conteiner5WindowConteinerLeftCRMTexto">
                        <strong>CRM</strong>
                        <small>Gerir clientes, vendas e anúncios</small>
                    </span>
                    <span className="Conteiner5WindowConteinerLeftCRMSeta" aria-hidden="true">›</span>
                </button>

                <div className="Conteiner5WindowConteinerLeftInformacapContacto">
                    <h6>INFORMAÇÕES DE CONTACTO</h6>
                    <div className="Conteiner5WindowConteinerLeftInformacapContactoBoxBottom">
                        <div className="Conteiner5WindowConteinerLeftInformacapContactoBoxBottomCaxa">
                            <span>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.18 2 2 0 0 1 3.61 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.56a16 16 0 0 0 5.53 5.53l.96-.88a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21 16.92z"/></svg>
                            </span>
                            <div>
                                <b>Telefone</b>
                                <li>+244 {dadosUsuario.telefone} </li>
                            </div>
                        </div>
                        <div className="Conteiner5WindowConteinerLeftInformacapContactoBoxBottomCaxa">
                            <span>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                            </span>
                            <div>
                                <b>Email</b>
                                <li> {dadosUsuario.email} </li>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="Conteiner5WindowConteinerLeftEndereco">
                    <h5>Endereço Principa</h5>
                    <div className="Conteiner5WindowConteinerLeftEnderecoContBottom">
                        <span>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                        </span>
                        <div>
                            <h6>cidade/Pais</h6>
                            <b> {dadosUsuario.provincia}/{dadosUsuario.pais}</b>
                            <li>{dadosUsuario.bairro}</li>
                        </div>
                    </div>
                </div>

                <div onClick={()=> setMostrarContRightWindow5(true)} className="menu_flutante">
                +
                </div>

            </div>
        </div>
        

        
    )
}