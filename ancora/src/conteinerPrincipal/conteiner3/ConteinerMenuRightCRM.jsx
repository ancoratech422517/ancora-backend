import { useState } from "react";
import "./css/ConteinerMenuRightCRM.css"
import { Polyline } from "ogl";
import ConteinerMenuRightCRMDashboard from "./ConteinerMenuRightCRMDashboard";
export default function ConteinerMenuRightCRM(){
    return (
        <div className="ConteinerMenuRightCRM">
            <div className="ConteinerMenuRightCRMMenuTop">
                <div className="ConteinerMenuRightCRMMenuTopBox1">
                    <div className="ConteinerMenuRightCRMMenuTopBox1FotoPerfilUsuario"></div>
                    <div className="ConteinerMenuRightCRMMenuTopBox1DadosUsuario">
                        <h2>Cláudio Avelino</h2>
                        <li>CRM-Administrativo da Âncora Ecommerce</li>
                    </div>
                </div>
                <div className="ConteinerMenuRightCRMMenuTopBox2">
                    <button>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-download">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                            <polyline points="7 10 12 15 17 10"></polyline>
                            <line x1="12" x2="12" y1="15" y2="3"></line>
                        </svg>
                        Exportar SVG
                    </button>
                    <button>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-plus">
                            <path d="M5 12h14"></path>
                            <path d="M12 5v14"></path>
                        </svg>
                        Novo Projecto
                    </button>
                </div>
            </div>
            <ConteinerMenuRightCRMDashboard />
        </div>
    )
}