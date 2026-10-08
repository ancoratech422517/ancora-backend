import { useState } from "react";
import "./css/Conteiner7ScrollDados5.css"
import Logo2 from "../../assets/logo2.png"
import { useUserStore } from "../../useUseSotore";
import { Conteiner2ScrollDadosDeletarSms } from "./js/Conteiner2ScrolldadosDeletarSms";
import { Conteiner2ScrollDadosDetalhesProduto } from "./js/Conteiner2ScrollDadosDetalhesProduto";
export default function Conteiner7ScrollDados5 ({dados}){
    const {setEstado , dadosUsuario , setDetalhesProduto , setAtivarDetalhes} = useUserStore()

    return (
        <div className="Conteiner7ScrollDados5">
            <div className="Conteiner7ScrollDados5Icone">
                <div className="Conteiner7ScrollDados5IconeImg">
                    <img src={Logo2} alt="" />
                </div>
            </div>
            <div className="Conteiner7ScrollDados5Cont">
                <div className="Conteiner7ScrollDadosContBox">
                    <div className="divBox">
                        <h3>Ancora E-Commerce</h3>
                        <li>Despósito realizado com sucesso</li>
                    </div>
                </div>
                <div className="Conteiner7ScrollDadosContBox">
                    <button onClick={()=>{Conteiner2ScrollDadosDeletarSms(dados.id , dadosUsuario.id , dados.tipo_notificacao , setEstado)}}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-trash-fill" viewBox="0 0 16 16">
                        <path d="M2.5 1a1 1 0 0 0-1 1v1a1 1 0 0 0 1 1H3v9a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V4h.5a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1H10a1 1 0 0 0-1-1H7a1 1 0 0 0-1 1zm3 4a.5.5 0 0 1 .5.5v7a.5.5 0 0 1-1 0v-7a.5.5 0 0 1 .5-.5M8 5a.5.5 0 0 1 .5.5v7a.5.5 0 0 1-1 0v-7A.5.5 0 0 1 8 5m3 .5v7a.5.5 0 0 1-1 0v-7a.5.5 0 0 1 1 0"/>
                        </svg>
                        Deletar
                    </button>
                    <button onClick={()=> Conteiner2ScrollDadosDetalhesProduto(dados , setDetalhesProduto , setAtivarDetalhes)}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-stack" viewBox="0 0 16 16">
                        <path d="m14.12 10.163 1.715.858c.22.11.22.424 0 .534L8.267 15.34a.6.6 0 0 1-.534 0L.165 11.555a.299.299 0 0 1 0-.534l1.716-.858 5.317 2.659c.505.252 1.1.252 1.604 0l5.317-2.66zM7.733.063a.6.6 0 0 1 .534 0l7.568 3.784a.3.3 0 0 1 0 .535L8.267 8.165a.6.6 0 0 1-.534 0L.165 4.382a.299.299 0 0 1 0-.535z"/>
                        <path d="m14.12 6.576 1.715.858c.22.11.22.424 0 .534l-7.568 3.784a.6.6 0 0 1-.534 0L.165 7.968a.299.299 0 0 1 0-.534l1.716-.858 5.317 2.659c.505.252 1.1.252 1.604 0z"/>
                        </svg>
                        Detalhes
                    </button>
                </div>
            </div>
        </div>
    )
}