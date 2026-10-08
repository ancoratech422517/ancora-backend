import { useState } from "react";
import "./css/Conteiner5WindwConteinerCarteira.css"
import { useUserStore } from "../../useUseSotore";
export default function Conteiner5WindowConteinerCarteira () {
    const {dadosUsuario , setEstadoConteinerDeposito} = useUserStore()
    return (
        <div className="Conteiner5WindwConteinerCarteira">
            <div className="Conteiner5WindwConteinerCarteiraDados">
                {/* INICIO DA FORMATAÇÃO DA CARTEIRA */}
                        <div className="credit-card" id="creditCard">
    
                            <div className="card-face card-front">
                                <div className="card-orb"></div>
                                <div className="card-top">
                                <div className="card-brand">Ancora<span>Pay</span></div>
                                <div className="card-network">
                                    <div className="network-circle"></div>
                                    <div className="network-circle"></div>
                                </div>
                                </div>
                                <div className="chip">
                                <div className="chip-body">
                                    <div className="chip-line"></div>
                                    <div className="chip-vline"></div>
                                </div>
                                </div>
                                <div className="card-number">
                                <span>••••</span>
                                <span>••••</span>
                                <span>••••</span>
                                <span style={{opacity:"1"}}>8421</span>
                                </div>
                                <div className="card-bottom">
                                <div>
                                    <div className="card-holder-label">Titular do Cartão</div>
                                    <div className="card-holder-name"> {dadosUsuario.nome} </div>
                                </div>
                                <div className="card-expiry-block" style={{textAlign:"right"}}>
                                    <div className="card-holder-label">Validade</div>
                                    <div className="card-holder-name">09 / 28</div>
                                </div>
                                </div>
                            </div>

                            <div className="card-face card-back">
                                <div className="magnetic-strip"></div>
                                <div className="cvv-section">
                                <div className="cvv-label">CVV / CVC</div>
                                <div className="cvv-bar">•••</div>
                                </div>
                                <div className="back-brand">AncoraPay</div>
                                <div className="back-site">ancora-commerce.ao</div>
                            </div>
                        </div>
                {/* FIM DA FORMATAÇÃO DA CARTEIRA DIGITAL */}
            </div>

            <div className="Conteiner5windwConteinerCarteiraValores">
                <div className="Conteiner5WindowConteinerCarteiraValoresBox">
                    <h5>Saldo Total</h5>
                    <h2>238.000 Kz</h2>
                    <h5>↑ +12.4% este mês</h5>
                    <span></span>
                </div>
                <div className="Conteiner5WindowConteinerCarteiraValoresBox">
                    <h5>Entradas</h5>
                    <h2 className="green">57.000 Kz</h2>
                    <h5>↑ +8.1%</h5>
                    <span></span>
                </div>
                <div className="Conteiner5WindowConteinerCarteiraValoresBox">
                    <h5>Saidas</h5>
                    <h2 className="red">133.000 Kz</h2>
                    <h5>↓ -3.2%</h5>
                    <span></span>
                </div>
            </div>

            <div className="Conteiner5WindowConteinerCarteiraAction">
                <li>
                    <span>
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-send-fill" viewBox="0 0 16 16">
                        <path d="M15.964.686a.5.5 0 0 0-.65-.65L.767 5.855H.766l-.452.18a.5.5 0 0 0-.082.887l.41.26.001.002 4.995 3.178 3.178 4.995.002.002.26.41a.5.5 0 0 0 .886-.083zm-1.833 1.89L6.637 10.07l-.215-.338a.5.5 0 0 0-.154-.154l-.338-.215 7.494-7.494 1.178-.471z"/>
                        </svg>
                    </span>
                    <b>Transferir</b>
                </li>
                <li>
                    <span>
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-credit-card" viewBox="0 0 16 16">
                        <path d="M0 4a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2zm2-1a1 1 0 0 0-1 1v1h14V4a1 1 0 0 0-1-1zm13 4H1v5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1z"/>
                        <path d="M2 10a1 1 0 0 1 1-1h1a1 1 0 0 1 1 1v1a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1z"/>
                        </svg>
                    </span>
                    <b>Sacar</b>
                </li>
                <li>
                    <span>
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-indent" viewBox="0 0 16 16">
                        <path fill-rule="evenodd" d="M3 8a.5.5 0 0 1 .5-.5h6.793L8.146 5.354a.5.5 0 1 1 .708-.708l3 3a.5.5 0 0 1 0 .708l-3 3a.5.5 0 0 1-.708-.708L10.293 8.5H3.5A.5.5 0 0 1 3 8"/>
                        <path fill-rule="evenodd" d="M12.5 4a.5.5 0 0 1 .5.5v7a.5.5 0 0 1-1 0v-7a.5.5 0 0 1 .5-.5"/>
                        </svg>
                    </span>
                    <b>Pagar</b>
                </li>
                <li onClick={()=>setEstadoConteinerDeposito("True")}>
                    <span>
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-layout-text-sidebar" viewBox="0 0 16 16">
                            <path d="M3.5 3a.5.5 0 0 0 0 1h5a.5.5 0 0 0 0-1zm0 3a.5.5 0 0 0 0 1h5a.5.5 0 0 0 0-1zM3 9.5a.5.5 0 0 1 .5-.5h5a.5.5 0 0 1 0 1h-5a.5.5 0 0 1-.5-.5m.5 2.5a.5.5 0 0 0 0 1h5a.5.5 0 0 0 0-1z"/>
                            <path d="M0 2a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2zm12-1v14h2a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1zm-1 0H2a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h9z"/>
                            </svg>
                    </span>
                    <b>Depositar</b>
                </li>
            </div>

            <div className="Conteiner5WindowConteinerCarteiraAtividadesRecentes">
                <div className="Conteiner5WindowConteinerCarteiraAtividadesRecentesDados">
                    <div className="Conteiner5WindowConteinerCarteiraAtividadesRecentesDadosIcone">
                        CA
                    </div>
                    <div className="Conteiner5WindowConteinerCarteiraAtividadesRecentesDadosText">
                        <b>Mercado Continente</b>
                        <li>hoje , 21:13 min</li>
                    </div>
                    <div className="Conteiner5WindowConteinerCarteiraAtividadesRecentesDadosEstado">
                        Sucesso
                    </div>
                    <div className="Conteiner5WindowConteinerCarteiraAtividadesRecentesDadosValor">
                        <span>-13.700 Kz</span>
                    </div>
                </div>
                <div className="Conteiner5WindowConteinerCarteiraAtividadesRecentesDados">
                    <div className="Conteiner5WindowConteinerCarteiraAtividadesRecentesDadosIcone">
                        CA
                    </div>
                    <div className="Conteiner5WindowConteinerCarteiraAtividadesRecentesDadosText">
                        <b>Mercado Continente</b>
                        <li>hoje , 21:13 min</li>
                    </div>
                    <div className="Conteiner5WindowConteinerCarteiraAtividadesRecentesDadosEstado">
                        Sucesso
                    </div>
                    <div className="Conteiner5WindowConteinerCarteiraAtividadesRecentesDadosValor">
                        <span>-13.700 Kz</span>
                    </div>
                </div>
                <div className="Conteiner5WindowConteinerCarteiraAtividadesRecentesDados">
                    <div className="Conteiner5WindowConteinerCarteiraAtividadesRecentesDadosIcone">
                        CA
                    </div>
                    <div className="Conteiner5WindowConteinerCarteiraAtividadesRecentesDadosText">
                        <b>Mercado Continente</b>
                        <li>hoje , 21:13 min</li>
                    </div>
                    <div className="Conteiner5WindowConteinerCarteiraAtividadesRecentesDadosEstado">
                        Sucesso
                    </div>
                    <div className="Conteiner5WindowConteinerCarteiraAtividadesRecentesDadosValor">
                        <span>-13.700 Kz</span>
                    </div>
                </div>
                <div className="Conteiner5WindowConteinerCarteiraAtividadesRecentesDados">
                    <div className="Conteiner5WindowConteinerCarteiraAtividadesRecentesDadosIcone">
                        CA
                    </div>
                    <div className="Conteiner5WindowConteinerCarteiraAtividadesRecentesDadosText">
                        <b>Mercado Continente</b>
                        <li>hoje , 21:13 min</li>
                    </div>
                    <div className="Conteiner5WindowConteinerCarteiraAtividadesRecentesDadosEstado">
                        Sucesso
                    </div>
                    <div className="Conteiner5WindowConteinerCarteiraAtividadesRecentesDadosValor">
                        <span>-13.700 Kz</span>
                    </div>
                </div>
                <div className="Conteiner5WindowConteinerCarteiraAtividadesRecentesDados">
                    <div className="Conteiner5WindowConteinerCarteiraAtividadesRecentesDadosIcone">
                        CA
                    </div>
                    <div className="Conteiner5WindowConteinerCarteiraAtividadesRecentesDadosText">
                        <b>Mercado Continente</b>
                        <li>hoje , 21:13 min</li>
                    </div>
                    <div className="Conteiner5WindowConteinerCarteiraAtividadesRecentesDadosEstado">
                        Sucesso
                    </div>
                    <div className="Conteiner5WindowConteinerCarteiraAtividadesRecentesDadosValor">
                        <span>-13.700 Kz</span>
                    </div>
                </div>
                <div className="Conteiner5WindowConteinerCarteiraAtividadesRecentesDados">
                    <div className="Conteiner5WindowConteinerCarteiraAtividadesRecentesDadosIcone">
                        CA
                    </div>
                    <div className="Conteiner5WindowConteinerCarteiraAtividadesRecentesDadosText">
                        <b>Mercado Continente</b>
                        <li>hoje , 21:13 min</li>
                    </div>
                    <div className="Conteiner5WindowConteinerCarteiraAtividadesRecentesDadosEstado">
                        Sucesso
                    </div>
                    <div className="Conteiner5WindowConteinerCarteiraAtividadesRecentesDadosValor">
                        <span>-13.700 Kz</span>
                    </div>
                </div>
                <div className="Conteiner5WindowConteinerCarteiraAtividadesRecentesDados">
                    <div className="Conteiner5WindowConteinerCarteiraAtividadesRecentesDadosIcone">
                        CA
                    </div>
                    <div className="Conteiner5WindowConteinerCarteiraAtividadesRecentesDadosText">
                        <b>Mercado Continente</b>
                        <li>hoje , 21:13 min</li>
                    </div>
                    <div className="Conteiner5WindowConteinerCarteiraAtividadesRecentesDadosEstado">
                        Sucesso
                    </div>
                    <div className="Conteiner5WindowConteinerCarteiraAtividadesRecentesDadosValor">
                        <span>-13.700 Kz</span>
                    </div>
                </div>
                <div className="Conteiner5WindowConteinerCarteiraAtividadesRecentesDados">
                    <div className="Conteiner5WindowConteinerCarteiraAtividadesRecentesDadosIcone">
                        CA
                    </div>
                    <div className="Conteiner5WindowConteinerCarteiraAtividadesRecentesDadosText">
                        <b>Mercado Continente</b>
                        <li>hoje , 21:13 min</li>
                    </div>
                    <div className="Conteiner5WindowConteinerCarteiraAtividadesRecentesDadosEstado">
                        Sucesso
                    </div>
                    <div className="Conteiner5WindowConteinerCarteiraAtividadesRecentesDadosValor">
                        <span>-13.700 Kz</span>
                    </div>
                </div>
                <div className="Conteiner5WindowConteinerCarteiraAtividadesRecentesDados">
                    <div className="Conteiner5WindowConteinerCarteiraAtividadesRecentesDadosIcone">
                        CA
                    </div>
                    <div className="Conteiner5WindowConteinerCarteiraAtividadesRecentesDadosText">
                        <b>Mercado Continente</b>
                        <li>hoje , 21:13 min</li>
                    </div>
                    <div className="Conteiner5WindowConteinerCarteiraAtividadesRecentesDadosEstado">
                        Sucesso
                    </div>
                    <div className="Conteiner5WindowConteinerCarteiraAtividadesRecentesDadosValor">
                        <span>-13.700 Kz</span>
                    </div>
                </div>
                <div className="Conteiner5WindowConteinerCarteiraAtividadesRecentesDados">
                    <div className="Conteiner5WindowConteinerCarteiraAtividadesRecentesDadosIcone">
                        CA
                    </div>
                    <div className="Conteiner5WindowConteinerCarteiraAtividadesRecentesDadosText">
                        <b>Mercado Continente</b>
                        <li>hoje , 21:13 min</li>
                    </div>
                    <div className="Conteiner5WindowConteinerCarteiraAtividadesRecentesDadosEstado">
                        Sucesso
                    </div>
                    <div className="Conteiner5WindowConteinerCarteiraAtividadesRecentesDadosValor">
                        <span>-13.700 Kz</span>
                    </div>
                </div>
                <div className="Conteiner5WindowConteinerCarteiraAtividadesRecentesDados">
                    <div className="Conteiner5WindowConteinerCarteiraAtividadesRecentesDadosIcone">
                        CA
                    </div>
                    <div className="Conteiner5WindowConteinerCarteiraAtividadesRecentesDadosText">
                        <b>Mercado Continente</b>
                        <li>hoje , 21:13 min</li>
                    </div>
                    <div className="Conteiner5WindowConteinerCarteiraAtividadesRecentesDadosEstado">
                        Sucesso
                    </div>
                    <div className="Conteiner5WindowConteinerCarteiraAtividadesRecentesDadosValor">
                        <span>-13.700 Kz</span>
                    </div>
                </div>

            </div>

        </div>
    )
}