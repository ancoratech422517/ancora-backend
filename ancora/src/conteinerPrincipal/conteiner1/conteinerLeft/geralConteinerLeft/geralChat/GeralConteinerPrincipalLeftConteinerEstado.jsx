import { useState } from "react";
import "../css/GeralConteinerPrincipalLeftConteinerEstado.css"
import SetaEsquerda from "../../../../components/conteinerSvg/setaEsquerda";
import { useUserStore } from "../../../../../useUseSotore";
import { GeralChatMenuButtomBuscarDadosEstado } from "../js/geralChatMenuBoxButtom";
export default function GeralConteinerPrincipalLeftConteinerEstado ({setViewChat}) {
    const {
            set_CONDICACAOMOSTRARESTADOETRURMAVIEWS , 
            set_CONFIRMARSAIDA ,
            set_DADOSTIPOVIEWSLAYUTELEFT , 
            DADOSESTADOAMIGO , 
            setTipoConteudoViewEstado , 
            setDadosGeralEstadoUser , 
            setMostrarConteinerEstadoUserViews

    } = useUserStore()
    return (
        <div className="GeralConteinerPrincipalLeftConteinerEstado">
            <header className="GeralConteinerPrincipalLeftConteinerEstado_menu">
                <li onClick={()=>{set_CONDICACAOMOSTRARESTADOETRURMAVIEWS(false)}}>
                    <SetaEsquerda />
                </li>
                <div>
                    Estado 
                     <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-radar" viewBox="0 0 16 16">
                    <path d="M6.634 1.135A7 7 0 0 1 15 8a.5.5 0 0 1-1 0 6 6 0 1 0-6.5 5.98v-1.005A5 5 0 1 1 13 8a.5.5 0 0 1-1 0 4 4 0 1 0-4.5 3.969v-1.011A2.999 2.999 0 1 1 11 8a.5.5 0 0 1-1 0 2 2 0 1 0-2.5 1.936v-1.07a1 1 0 1 1 1 0V15.5a.5.5 0 0 1-1 0v-.518a7 7 0 0 1-.866-13.847"/>
                    </svg>
                </div>
            </header>
            <nav>
                <div className="GeralConteinerPrincipalLeftConteinerEstadoConteinerPerfilDate">
                    <div className="GeralConteinerPrincipalLeftConteinerEstadoConteinerPerfilDateUserFixo" onClick={()=>{set_CONFIRMARSAIDA(false) , set_DADOSTIPOVIEWSLAYUTELEFT(false), setViewChat("estado_usuario"), GeralChatMenuButtomBuscarDadosEstado() , setViewChat=setViewChat}}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-plus" viewBox="0 0 16 16">
                        <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4"/>
                        </svg>
                    </div>
                    <div className="GeralConteinerPrincipalLeftConteinerEstadoConteinerPerfilDateConteinerScroll">
                        {DADOSESTADOAMIGO.map((dados)=>{
                            return(
                                <div className="GeralConteinerPrincipalLeftConteinerEstadoConteinerPerfilDateConteinerScrollDate" onClick={()=>{setViewChat("estado_usuario") , setTipoConteudoViewEstado(dados.tipo_estado) , setDadosGeralEstadoUser(dados) , setMostrarConteinerEstadoUserViews(true) , set_CONFIRMARSAIDA(true) , setViewChat = setViewChat}}>
                                    <img src={dados.foto_usuario_estado} alt="" />
                                </div>
                            )
                        })}
                    </div>
                </div>
            </nav>
        </div>
    )
}