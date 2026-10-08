import { useState } from "react";
import { ClicarButtom } from "../conteinerComponentsJs/buttonAction";
import "../conteinerComponentesCss/btn5.css"
import Profile from "../conteinerSvg/profile";
import { useUserStore } from "../../../useUseSotore";

export default function Button5 ({ativarConteiner , setDadosUsuario}){
    const setDados = useUserStore((state) => state.setDados);
    return (
        <button className="btn3" onClick={(e)=> ClicarButtom (e , ativarConteiner , "conteiner5" , setDados) }> 
           <Profile />
        </button>
        

    )

}
