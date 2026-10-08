import { useState } from "react";
import "./css/BoxDetalhes3.css"
import Logo from "../../../assets/logo2.png"
import { useUserStore } from "../../../useUseSotore";
export default function BoxDetalhes3 ({DetalhesProduto}){
    const {setAtivarDetalhes} = useUserStore()
    return (
        <div className="BoxDetalhes3">
            <div className="BoxDetalhes3Box">
                <div className="BoxDetalhes3BoxIcone">
                    <div className="BoxDetalhes3BoxIconeImg">
                        <img src={Logo} alt="Logo" />
                    </div>
                </div>
                <div className="BoxDetalhes3BoxCont">
                    <h3>Ancora Ecommerce</h3>
                    <li>o seu deposito foi realizado com sucessso!</li>
                </div>
            </div>
            <div className="BoxDetalhes3Box">
                <li className="alignLeft">
                    voce deposito {DetalhesProduto?.valor_deposito || 0} kz para a sua conta 
                    <b>
                        AncoraPay
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-credit-card-2-back-fill" viewBox="0 0 16 16">
                        <path d="M0 4a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v5H0zm11.5 1a.5.5 0 0 0-.5.5v1a.5.5 0 0 0 .5.5h2a.5.5 0 0 0 .5-.5v-1a.5.5 0 0 0-.5-.5zM0 11v1a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-1z"/>
                        </svg>
                    </b>
                    caso haja um incoveniente na quantia recebida <a className="link" href="tel:+946212157">fale com o suporte</a>
                </li>
            </div>
            <div className="closeDetalhe3" onClick={() => setAtivarDetalhes("False")}>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-x" viewBox="0 0 16 16">
                <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708"/>
                </svg>
            </div>
        </div>
    )
}