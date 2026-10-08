import { useState } from "react";   
import "./css/Conteiner7.css"
import Conteiner7Menu from "./conteiner7MenuTop";
import Conteiner7Scroll from "./conteiner7Scroll";
import { useUserStore } from "../../useUseSotore";
export default function Conteiner7 ({setViewChat}) {
    
    const {AtivarDetalhes, DetalhesProduto , setAtivarDetalhes , urlBancoDeDados} = useUserStore()
    const condicaoMostrarDetalhe = ()=>{
        switch(AtivarDetalhes){
            case "True":
                const URLFOTOUSUARIO = `${DetalhesProduto.foto_usuario}`
                return (
                        <div className="Box_Modal_dados_produtto">
                            <div className="Box_Modal_dados_produttoImage">
                                <div className="Box_Modal_dados_produttoImageIcone">
                                    <img src={DetalhesProduto.imagem_produto} alt="" />
                                    <button onClick={()=> setAtivarDetalhes("False")}>close</button>
                                </div>
                                <div className="Box_Modal_dados_produttoImageCont">
                                    <b> {DetalhesProduto.nome_produto} </b>
                                    <h2>{DetalhesProduto.preco_produto}</h2>
                                    <li>data <b> {DetalhesProduto.data} </b></li>

                                    <div className="Credencias_vendedor">
                                        <div className="Credencias_vendedorImage">
                                            <img src={URLFOTOUSUARIO} alt="" />
                                        </div>
                                        <div className="Credencias_vendedorCont">
                                            <b> {DetalhesProduto.nome_remetente} </b>
                                            <li>Vendedor Oficial da Ancora</li>
                                        </div>
                                    </div>

                                </div>
                            </div>
                        </div>

                )
        }
    }

    return (
        <div className="Conteiner7">
            <Conteiner7Menu setViewChat = {setViewChat} />
            <Conteiner7Scroll />
            <div className="Menssagem_modal_notificacao">
                <b>Notificação Eliminada 📧</b>
            </div>
            {condicaoMostrarDetalhe()}
        </div>
    )
}