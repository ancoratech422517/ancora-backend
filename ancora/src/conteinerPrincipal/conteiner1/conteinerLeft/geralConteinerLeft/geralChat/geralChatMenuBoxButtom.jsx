import { useState } from "react";
import "../css/GeralChatMenuButtom.css"
import { GeralChatMenuButtomBuscarDadosEstado } from "../js/geralChatMenuBoxButtom";
import { useUserStore } from "../../../../../useUseSotore";
export default function GeralChatMenuButtom ({setViewChat}){
    const {
            DADOSESTADOAMIGO , 
            setMostrarConteinerEstadoUserViews , 
            setTipoConteudoViewEstado,
            setDadosGeralEstadoUser , 
            set_DADOSTIPOVIEWSLAYUTELEFT , 
            set_CONFIRMARSAIDA ,
           
        } = useUserStore()

    return (
        <div className="GeralChatMenuButtom">
            {/* <div className="GeralChatMenuButtomPerfilFixoUserEstado" onClick={()=>{set_CONFIRMARSAIDA(false) , set_DADOSTIPOVIEWSLAYUTELEFT(false) , setViewChat("estado_usuario") , GeralChatMenuButtomBuscarDadosEstado(), setViewChat=setViewChat}}>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-plus" viewBox="0 0 16 16">
                <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4"/>
                </svg>
            </div>
             <div className="GeralChatMenuButtomPerfilEstadoScroll">

                    {DADOSESTADOAMIGO.map((dados)=>{
                      
                    return(
                
                            <div className="GeralChatMenuButtomPerfilEstadoScrollIconeAmigo" onClick={()=>{setViewChat("estado_usuario"), setTipoConteudoViewEstado(dados.tipo_estado) , setDadosGeralEstadoUser(dados) ,  setMostrarConteinerEstadoUserViews(true) , set_CONFIRMARSAIDA(true) ,   setViewChat = setViewChat}}>
                                <img src={dados.foto_usuario_estado} alt="" />
                            </div>    
                    
                    )
                    })}
            </div> */}
            <li className="GeralChatMenuButtomText ativar_opcao">Todos</li>
            <li className="GeralChatMenuButtomText">Nao lidas</li>
            <li className="GeralChatMenuButtomText">Privado</li>
            <li className="GeralChatMenuButtomText">Bloqueado</li>

        </div>
    )
}