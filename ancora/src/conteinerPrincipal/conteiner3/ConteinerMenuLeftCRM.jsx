import { useState } from "react";
import "./css/ConteinerMenuLeftCRM.css"
import IMGPERFIL from "../../assets/IMGPERFIL.png"
export default function ConteinerMenuLeftCRM () {
    return (
            <div className="ConteinerMenuLeftCRM">
                <div className="ConteinerMenuLeftCRM_Menu_Top">
                    <div className="ConteinerMenuLeftCRM_Menu_Top_icone">
                        <img src={IMGPERFIL} alt="" />
                    </div>
                    <div className="ConteinerMenuLeftCRM_Menu_Top_conteudo">
                        <h2><b className="teal">Ân</b>cora</h2>
                        <li>CRM Adminisrativo</li>
                    </div>
                </div>
                <div className="ConteinerMenuLeftCRM_Menu_Center">
                    <div className="ConteinerMenuLeftCRM_Menu_Center_Menu_Center_TXT">
                        <svg xmlns="http://www.w3.org/2000" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" class="lucide lucide-layout-dashboard ico" >
                            <rect width = "7" height="9" x = "3" y = "3" rx = "1"></rect>
                            <rect width = "7" height="5" x = "14" y = "3" rx = "1"></rect>
                            <rect width = "7" height="9" x = "14" y = "12" rx = "1"></rect>
                            <rect width = "7" height="5" x = "3" y = "16" rx = "1"></rect>
                        </svg>
                        <li>DashBoard</li>
                    </div>
                    <div className="ConteinerMenuLeftCRM_Menu_Center_Menu_Center_TXT">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" class="lucide lucide-folder-kanban ico" >
                            <path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z"></path>
                            <path d="M8 10v4"></path>
                            <path d="M16 10v6"></path>
                            <path d="M12 10v2"></path>
                        </svg>
                        <li>Projectos</li>
                    </div>
                    <div className="ConteinerMenuLeftCRM_Menu_Center_Menu_Center_TXT">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-users ico" >
                            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                            <circle cx="9" cy="7" r="4"></circle>
                            <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
                            <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                        </svg>
                        <li>Clientes</li>
                    </div>
                    <div className="ConteinerMenuLeftCRM_Menu_Center_Menu_Center_TXT">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-wallet ico">
                            <path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1"></path>
                            <path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4"></path>
                        </svg>
                        <li>Financeiro</li>
                    </div>
                    <div className="ConteinerMenuLeftCRM_Menu_Center_Menu_Center_TXT">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-file-text ico" >
                            <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"></path>
                            <path d="M14 2v4a2 2 0 0 0 2 2h4"></path>
                            <path d="M10 9H8"></path>
                            <path d="M16 13H8"></path>
                            <path d="M16 17H8"></path>
                        </svg>
                        <li>Faturas</li>
                    </div>
                    <div className="ConteinerMenuLeftCRM_Menu_Center_Menu_Center_TXT">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-calendar-days ico" >
                            <path d="M8 2v4"></path>
                            <path d="M16 2v4"></path>
                            <rect width="18" height="18" x="3" y="4" rx="2"></rect>
                            <path d="M3 10h18"></path>
                            <path d="M8 14h.01"></path>
                            <path d="M12 14h.01"></path>
                            <path d="M16 14h.01"></path>
                            <path d="M8 18h.01"></path>
                            <path d="M12 18h.01"></path>
                            <path d="M16 18h.01"></path>
                        </svg>
                        <li>Calendario</li>
                    </div>
                    <div className="ConteinerMenuLeftCRM_Menu_Center_Menu_Center_TXT">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-chart-column ico">
                            <path d="M3 3v16a2 2 0 0 0 2 2h16"></path>
                            <path d="M18 17V9"></path>
                            <path d="M13 17V5"></path>
                            <path d="M8 17v-3"></path>
                        </svg> 
                        <li>Relatorios</li>
                    </div>
                    <div className="ConteinerMenuLeftCRM_Menu_Center_Menu_Center_TXT"></div>
                    <div className="ConteinerMenuLeftCRM_Menu_Center_Menu_Center_TXT"></div>
                </div>
            </div>
    )
}