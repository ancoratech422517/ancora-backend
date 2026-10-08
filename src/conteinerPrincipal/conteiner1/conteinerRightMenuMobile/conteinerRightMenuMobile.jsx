import { useState } from "react";
import "./css/ConteinerRightMenuMobile.css"
import Cart from "../../components/conteinerSvg/cart";
import Erro from "../../components/conteinerSvg/erro";
import ConteinerRightMenuMobileSCrollDados from "./ConteinerRightMenuMobileScrollDados";
import { useUserStore } from "../../../useUseSotore";
import { EsconderMenuMobileRight } from "../conteinerRight/js/menuMobile";
export default function ConteinerRightMenuMobile () {
    const {ProdutoUsuarioChat , ChatAtivo , setMostrarChat} = useUserStore()
    return (
        <div className="ConteinerRightMenuMobile">
            <div className="ConteinerRightMenuTopMobile">
                <div className="ConteinerRightMenuMobileBox1">
                    <h4>{ChatAtivo?.nome_amigo}</h4>
                    <li>
                        <Cart />
                        <b>MarketPlace</b>
                    </li>
                </div>
                <div className="ConteinerRightMenuMobileBox2" onClick={ ()=> EsconderMenuMobileRight(setMostrarChat)}>
                    <Erro />
                </div>
            </div>

            <div className="ConteinerRightMenuMobileScroll">
                {Array.isArray(ProdutoUsuarioChat) && ProdutoUsuarioChat.length > 0 ? (
                    ProdutoUsuarioChat.map((item , index)=>(
                        <ConteinerRightMenuMobileSCrollDados
                            key={index}
                            dados = {item}
                        />
                    ))
                ):(
                    <p style={{ color: "gray", textAlign: "center", width: "100%", padding: "60px 20px" }}>
                            A estore do seu amigo esta vazia
                    </p>
                )}
                
            </div>
        </div>
    )
}