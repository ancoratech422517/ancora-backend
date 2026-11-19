import { useUserStore } from "../../useUseSotore";
import "./css/Conteiner5WindowConteinerRight.css"
import Conteiner5WindowConteinerGeral from "./Conteiner5WindowConteinerRightGeral";
import Conteiner5WindowConteinerGrupo from "./Conteiner5WindowConteinerGrupo";
import Conteiner5WindowConteinerTrafego from "./conteiner5WindowConteinerTrafego";
import Erro from "../components/conteinerSvg/erro";
export default function Conteiner5WindowConteinerRight () {
    const {setAtivarCont , setAtivar , AtivarCont , setMostrarContRightWindow5} = useUserStore()
    
    const ativar_conteiner = ()=>{
        switch(AtivarCont){
            case "geral":
                return <Conteiner5WindowConteinerGeral />
            case "Grupo":
                return <Conteiner5WindowConteinerGrupo />
            case "Trafego":
                return <Conteiner5WindowConteinerTrafego />
        }
    }

    return (
        <div className="Conteiner5WindowConteinerRight">
            <div className="Conteiner5WindowConteinerRightMenuTop">
                <div className="Conteiner5WindowConteinerRightMenuTopCont">
                    <li onClick={()=> setAtivarCont("geral")}>Geral</li>
                    <li onClick={()=> setAtivarCont("Grupo")}>Criar Grupo</li>
                    <li onClick={()=> setAtivarCont("Trafego")}>Trafego</li>
                    <li onClick={() => setAtivar("wallet")}>Carteira</li>
                </div>
                
            </div>


            {ativar_conteiner()}

            <div onClick={()=> setMostrarContRightWindow5(false)} className="menu_flutante_ocultar">
                <Erro />
            </div>
        </div>
    )
}