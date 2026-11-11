import { useState } from "react";
import "./css/Conteiner3.css";
import ConteinerMenuLeftCRM from "./ConteinerMenuLeftCRM";
import ConteinerMenuRightCRM from "./ConteinerMenuRightCRM";
import "./css/ConteinerResponsivo.css"; // por último, para sobrepor os estilos base

export default function Conteiner3({ onVoltar = () => { window.location.href = "/"; } }) {
    const [page, setPage] = useState("dashboard"), [menu, setMenu] = useState(false);
    const ir = k => { setPage(k); setMenu(false); };
    return (
        <div className="Conteiner3">
            <ConteinerMenuLeftCRM page={page} onPage={ir} aberto={menu} onVoltar={onVoltar} />
            <div className={"crmOverlay" + (menu ? " aberto" : "")} onClick={() => setMenu(false)} />
            <ConteinerMenuRightCRM page={page} onPage={ir} onMenu={() => setMenu(true)} />
        </div>
    );
}
