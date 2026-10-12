import { useState } from "react";
import "./css/ConteinerMenuRightCRMDashboard.css"
export default function ConteinerMenuRightCRMDashboard () {
    return (
        <div className="ConteinerMenuRightCRMDashboard">
            {/* INICIO DA ORMATAÇÃO DA BOX TOP */}
            <div className="ConteinerMenuRightCRMDashboardBoxTop">
                <div className="ConteinerMenuRightCRMDashboardBoxTopCaxa">
                    <div>
                        <li>Saldo Actual</li>
                        <p>
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="teal" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-dollar-sign">
                                <line x1="12" x2="12" y1="2" y2="22"></line>
                                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                            </svg>
                        </p>
                    </div>
                    <h2>KZ 123.750</h2>
                    <ul>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-arrow-up-right">
                            <path d="M7 7h10v10"></path>
                            <path d="M7 17 17 7"></path>
                        </svg>
                        <span>+12% este mes</span>
                    </ul>
                </div>
                <div className="ConteinerMenuRightCRMDashboardBoxTopCaxa">
                    <div>
                        <li>Recebido</li>
                        <p>
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="teal" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"class="lucide lucide-trending-up">
                                <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"></polyline>
                                <polyline points="16 7 22 7 22 13"></polyline>
                            </svg>
                        </p>
                    </div>
                    <h2>KZ 123.750</h2>
                    <ul>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-arrow-up-right">
                            <path d="M7 7h10v10"></path>
                            <path d="M7 17 17 7"></path>
                        </svg>
                        <span>+12% este mes</span>
                    </ul>
                </div>
                <div className="ConteinerMenuRightCRMDashboardBoxTopCaxa">
                    <div>
                        <li>Gastos</li>
                        <p>
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="teal" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-trending-down">
                               <polyline points="22 17 13.5 8.5 8.5 13.5 2 7"></polyline>
                               <polyline points="16 17 22 17 22 11"></polyline>
                            </svg>
                        </p>
                    </div>
                    <h2>KZ 123.750</h2>
                    <ul>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-arrow-up-right">
                            <path d="M7 7h10v10"></path>
                            <path d="M7 17 17 7"></path>
                        </svg>
                        <span>+12% este mes</span>
                    </ul>
                </div>
                <div className="ConteinerMenuRightCRMDashboardBoxTopCaxa">
                    <div>
                        <li>Projectos Ativos</li>
                        <p>
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="teal" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-briefcase">
                               <path d="M16 20V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
                               <rect width="20" height="14" x="2" y="6" rx="2"></rect>
                            </svg>
                        </p>
                    </div>
                    <h2>7</h2>
                    <ul>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-arrow-up-right">
                            <path d="M7 7h10v10"></path>
                            <path d="M7 17 17 7"></path>
                        </svg>
                        <span>10 Totais</span>
                    </ul>
                </div>
                <div className="ConteinerMenuRightCRMDashboardBoxTopCaxa">
                    <div>
                        <li>Faturas Pendente</li>
                        <p>
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="teal" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-file-text">
                                <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"></path>
                                <path d="M14 2v4a2 2 0 0 0 2 2h4"></path>
                                <path d="M10 9H8"></path>
                                <path d="M16 13H8"></path>
                                <path d="M16 17H8"></path>
                            </svg>
                        </p>
                    </div>
                    <h2>KZ 123.750</h2>
                    <ul>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-arrow-up-right">
                            <path d="M7 7h10v10"></path>
                            <path d="M7 17 17 7"></path>
                        </svg>
                        <span>+12% este mes</span>
                    </ul>
                </div>

            </div>
            {/* FIM DA ORMATAÇÃO DA BOX TOP */}

            {/* INICIO DA FORMATAÇÃO DA BOX CENTER */}
            <div className="ConteinerMenuRightCRMDashboardBoxCenter">
                <div className="ConteinerMenuRightCRMDashboardBoxCenterBox1"></div>
                <div className="ConteinerMenuRightCRMDashboardBoxCenterBox2">
                    <div className="ConteinerMenuRightCRMDashboardBoxCenterBox2Box1">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-chart-pie" >
                            <path d="M21 12c.552 0 1.005-.449.95-.998a10 10 0 0 0-8.953-8.951c-.55-.055-.998.398-.998.95v8a1 1 0 0 0 1 1z"></path>
                            <path d="M21.21 15.89A10 10 0 1 1 8 2.83"></path>
                        </svg>
                        <h3>Gastos por Categoria</h3>
                    </div>
                    <div className="ConteinerMenuRightCRMDashboardBoxCenterBox2Box2">
                        <div className="ConteinerMenuRightCRMDashboardBoxCenterBox2Box2Conteudo">
                            <li>Parede</li>
                            <b>85% - 75.000 KZ</b>
                        </div>
                        <div className="ConteinerMenuRightCRMDashboardBoxCenterBox2Box2Progresso">
                            <div className="ConteinerMenuRightCRMDashboardBoxCenterBox2Box2ProgressoDados1"></div>
                        </div>
                    </div>
                    <div className="ConteinerMenuRightCRMDashboardBoxCenterBox2Box2">
                        <div className="ConteinerMenuRightCRMDashboardBoxCenterBox2Box2Conteudo">
                            <li>Afiliados</li>
                            <b>85% - 75.000 KZ</b>
                        </div>
                        <div className="ConteinerMenuRightCRMDashboardBoxCenterBox2Box2Progresso">
                            <div className="ConteinerMenuRightCRMDashboardBoxCenterBox2Box2ProgressoDados1"></div>
                        </div>
                    </div>
                    <div className="ConteinerMenuRightCRMDashboardBoxCenterBox2Box2">
                        <div className="ConteinerMenuRightCRMDashboardBoxCenterBox2Box2Conteudo">
                            <li>Ferramentas</li>
                            <b>21% - 75.000 KZ</b>
                        </div>
                        <div className="ConteinerMenuRightCRMDashboardBoxCenterBox2Box2Progresso">
                            <div className="ConteinerMenuRightCRMDashboardBoxCenterBox2Box2ProgressoDados1"></div>
                        </div>
                    </div>
                    <div className="ConteinerMenuRightCRMDashboardBoxCenterBox2Box2">
                        <div className="ConteinerMenuRightCRMDashboardBoxCenterBox2Box2Conteudo">
                            <li>Trafego Pago</li>
                            <b>13% - 75.000 KZ</b>
                        </div>
                        <div className="ConteinerMenuRightCRMDashboardBoxCenterBox2Box2Progresso">
                            <div className="ConteinerMenuRightCRMDashboardBoxCenterBox2Box2ProgressoDados1"></div>
                        </div>
                    </div>

                </div>
            </div>
            {/* FIM DA FORMATAÇÃO DA BOX CENTER */}

            {/* INICIO DA FORMATAÇÃO DA BOX BOTTOM */}
            <div className="ConteinerMenuRightCRMDashboardBoxBottom">
                <div className="ConteinerMenuRightCRMDashboardBoxBottomBoxLeft">
                    <div className="ConteinerMenuRightCRMDashboardBoxBottomBoxLeftBox1"></div>
                    <div className="ConteinerMenuRightCRMDashboardBoxBottomBoxLeftBox2"></div>
                </div>
                <div className="ConteinerMenuRightCRMDashboardBoxBottomRight"></div>
            </div>
            {/* FIM DA FORMATAÇÃO DA BOX BOTTOM */}

        </div>
    )
}