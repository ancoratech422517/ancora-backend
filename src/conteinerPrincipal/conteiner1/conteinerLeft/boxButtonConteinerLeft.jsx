import { useState } from "react";
import "./css/BoxButtomConteinerLeft.css"
import Button6 from "../../components/conteinerComponentesJsx/btn6";
import { useUserStore } from "../../../useUseSotore";
export default function ({ativarConteiner}){
    const {dadosUsuario , urlBancoDeDados} = useUserStore()
    let valor = "false"
    if (dadosUsuario.foto_usuario !== "none"){
        valor = "True"
    }
    const [estadoFotoUsuario , setEstadoFotoUsuario] = useState(valor)
    const condiaoEstadoFotoUsuario = ()=>{
        switch(estadoFotoUsuario){
            case "False":
                return (
                    <b>
                        a
                    </b>
                )
            case "True":
                const URLIMAGE = `${dadosUsuario.foto_usuario}`
                return (
                    <div className="BoxButtomConteinerLeftIcone">
                        <img src={URLIMAGE} alt="" />
                    </div>
                )
        }
    }

    return (
        <div className="BoxButtomConteinerLeft">
           {condiaoEstadoFotoUsuario()}
        </div>
    )
}