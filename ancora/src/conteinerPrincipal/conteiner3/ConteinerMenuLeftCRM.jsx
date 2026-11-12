import "./css/ConteinerMenuLeftCRM.css";
import IMGPERFIL from "../../assets/IMGPERFIL.png";
import Ico from "./Icons";
import { useUserStore } from "../../useUseSotore";
import PERFIL from "../../assets/img_fundo_vazio/perfil.png";
export const MENU = [["dashboard", "DashBoard"], ["projectos", "Projectos"], ["clientes", "Clientes"], ["financeiro", "Financeiro"], ["faturas", "Faturas"], ["calendario", "Calendario"], ["relatorios", "Relatorios"], ["turmas", "Turmas"], ["anuncios", "Gerar anúncios"], ["leads", "Leads"]];
const T = "ConteinerMenuLeftCRM_Menu_Center_Menu_Center_TXT";

export default function ConteinerMenuLeftCRM({ page, onPage, onVoltar, aberto }) {
    const fotoUsuario = useUserStore(state => state.dadosUsuario?.foto_usuario || PERFIL);
    const nomeUsuario = useUserStore(state => state.dadosUsuario?.nome);
    return (
        <div className={"ConteinerMenuLeftCRM" + (aberto ? " aberto" : "")}>
            <div className="ConteinerMenuLeftCRM_Menu_Top">
                <div className="ConteinerMenuLeftCRM_Menu_Top_icone">
                    <img src={IMGPERFIL} alt="" />
                </div>
                <div className="ConteinerMenuLeftCRM_Menu_Top_conteudo">
                    <h2><b className="teal">Ân</b>cora</h2>
                    <li>CRM Administrativo</li>
                </div>
            </div>
            <div className="ConteinerMenuLeftCRMPerfilUsuario">
                <div className="ConteinerMenuLeftCRMPerfilUsuarioFotoUser">
                    <img src={fotoUsuario} alt="" />
                </div>
                <div className="ConteinerMenuLeftCRMPerfilUsuarioConteudoUser">
                    <h3>{nomeUsuario || "Minha conta"}</h3>
                    <li>administrando a minha carreira</li>
                </div>
            </div>
            <div className="ConteinerMenuLeftCRM_Menu_Center">
                {MENU.map(([k, l]) => (
                    <div key={k} className={T + (page === k ? " ativarElemento" : "")} onClick={() => onPage(k)}>
                        <Ico n={k} /><li>{l}</li>
                    </div>
                ))}
                
            </div>
        </div>
    );
}
