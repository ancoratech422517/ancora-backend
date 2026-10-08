import { useState } from "react";
import "./css/Conteiner5WindowConteinerLeft.css"
import { useUserStore } from "../../useUseSotore";
import Editar from "../components/conteinerSvg/editar";
import Logo from "../../assets/logo2.png"
import { Actualizar_foto_Perfil } from "./js/Conteiner5WindowConteinerRegistrarFoto";
import { Imagem_em_tempo_real } from "./js/imagem_tempo_real";
export default function Conteiner5WindowConteinerLeft () {
        const {setMostrarContRightWindow5 , dadosUsuario , urlBancoDeDados} = useUserStore()
        const [estadoFoto , setEstadoFoto] = useState("texto")
        const [valorFoto , setValorFoto] = useState("CA")
        const getUrlVideo = (url) => {
        if (!url) return "";
            // Verifica se a URL já começa com http ou https
            const isUrlCompleta = url.startsWith("http://") || url.startsWith("https://");
            
            return isUrlCompleta ? url : `${urlBancoDeDados}/${url}`;
        };

        let valor = "none"

        if(dadosUsuario.foto_usuario !== "none"){
            valor = "ativo"
        }

        const [estado_escolha , setEstadoEscolha] = useState(valor)
        const estadoEscolhaPerfil = ()=>{
            switch(estado_escolha){
                case "none":
                    return (
                        <b> {valorFoto} </b>
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
                </div>

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