import { useState } from "react";
import "./css/boxDetalhes1.css"
import { useUserStore } from "../../../useUseSotore";
export default function BoxDetalhes1 ({DetalhesProduto}) {
    const {setAtivarDetalhes} = useUserStore()
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
                                            <img src="none" alt="" />
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