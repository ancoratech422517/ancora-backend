import { useState } from "react";
import "./css/BoxDetalhes2.css"
import Logo from "../../../assets/logo2.png"
import { useUserStore } from "../../../useUseSotore";
export default function BoxDetalhes2 ({DetalhesProduto}) {
    const {setAtivarDetalhes} = useUserStore()
    return (
        <div className="BoxDetalhes2">
            <div className="BoxDetalhes2Box">
                <div className="BoxDetalhes2BoxIcone">
                    <div className="BoxDetalhes2BoxIconeImg">
                        <img src={Logo} alt="" />
                    </div>
                </div>
                <div className="BoxDetalhes2BoxCont">
                    <h3>Ancora Ecommerce</h3>
                    <li>a sua publicidade esta em andamento</li>
                </div>
            </div>
            <div className="BoxDetalhes2Box">
                <div className="BoxDetalhes2BoxImageProduto">
                    <img src={DetalhesProduto.imagem_produto} alt="" />
                </div>
                <div className="BoxDetalhes2BoxContProduto">
                    <h3>Tráfego Pago</h3>
                    <li>Voce pode acompanhar o progresso do seu trafego no seu perfil</li>
                </div>
            </div>
            <div className="CloseDetalhes" onClick={()=>{setAtivarDetalhes("False")}}>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-x" viewBox="0 0 16 16">
                <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708"/>
                </svg>
            </div>
        </div>
    )
}
