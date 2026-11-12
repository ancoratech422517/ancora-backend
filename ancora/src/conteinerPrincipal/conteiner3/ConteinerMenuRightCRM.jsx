import { useState, useEffect } from "react";
import "./css/ConteinerMenuRightCRM.css";
import "./css/ConteinerCRMPages.css";
import Ico from "./Icons";
import { useUserStore } from "../../useUseSotore";
import { onStatus } from "./api";
import { exportSvgs } from "./Charts";
import ConteinerMenuRightCRMDashboard from "./ConteinerMenuRightCRMDashboard";
import PERFIL from "../../assets/img_fundo_vazio/perfil.png";
import { DataPage, Calendario, Relatorios } from "./ConteinerCRMPages";
import AnunciosPage from "./AnunciosPage";
import LeadsPage from "./LeadsPage";

export default function ConteinerMenuRightCRM({ page, onPage, onMenu }) {
    const fotoUsuario = useUserStore(state => state.dadosUsuario?.foto_usuario || PERFIL);
    const [on, setOn] = useState(null), [novo, setNovo] = useState(0);
    const nomeUsuario = useUserStore(state => state.dadosUsuario?.nome);
    useEffect(() => onStatus(setOn), []);
    useEffect(() => { if (page !== "projectos") setNovo(0); }, [page]);
    const P = { dashboard: <ConteinerMenuRightCRMDashboard />, calendario: <Calendario />, relatorios: <Relatorios />, anuncios: <AnunciosPage />, leads: <LeadsPage /> };
    const statusLabel = on === true ? "Base de dados ligada" : on === false ? "Backend indisponível" : "A ligar ao backend";
    return (
        <div className="ConteinerMenuRightCRM">
            <div className="ConteinerMenuRightCRMMenuTop">
                <div className="ConteinerMenuRightCRMMenuTopBox1">
                    <button className="crmMenuBtn" onClick={onMenu} aria-label="Abrir menu"><Ico n="menu" /></button>
                    <div className="ConteinerMenuRightCRMMenuTopBox1FotoPerfilUsuario">
                        <img src={fotoUsuario} alt="" />
                    </div>
                    <div className="ConteinerMenuRightCRMMenuTopBox1DadosUsuario">
                        <h2>{nomeUsuario || "Minha conta"} <span className={"crmStatus " + (on ? "on" : "off")}>{statusLabel}</span></h2>
                        <li>CRM-Administrativo da Âncora Ecommerce</li>
                    </div>
                </div>
                <div className="ConteinerMenuRightCRMMenuTopBox2">
                    <button onClick={exportSvgs} title="Exportar SVG"><Ico n="download" /><span className="lbl">Exportar SVG</span></button>
                    <button onClick={() => { onPage("projectos"); setNovo(n => n + 1); }} title="Novo Projecto"><Ico n="plus" /><span className="lbl">Novo Projecto</span></button>
                </div>
            </div>
            {P[page] || <DataPage key={page} res={page} novo={page === "projectos" ? novo : 0} />}
        </div>
    );
}
