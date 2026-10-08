import { useState } from "react";
import "./css/Conteiner4RightWindowMenuTop.css"
import { Clicado } from "./js/Conteiner4RightWindowMenuTopBoxBottom";
import SetaBaixo from "../components/conteinerSvg/setaBaixo";
export default function Conteiner4RighrWindowMenuTop ({ativarConteiner}) {
    return (
        <div className="Conteiner4RightWindowMenuTop">
            <h2>DashBoard</h2>
            <div className="Conteiner4RightWindowMenuTopBoxBottom">
                <li onClick={(e)=> Clicado (e , ativarConteiner , "dashboard") } >
                    <div className="Conteiner4RightWindowMenuTopBoxBottomLiSetaBaixo">
                        <b>DashBoard</b>
                        <SetaBaixo />
                    </div>
                    <span className="anima"></span>
                </li>
                <li onClick={(e)=> Clicado (e , ativarConteiner , "produto")}>
                    <div className="Conteiner4RightWindowMenuTopBoxBottomLiSetaBaixo">
                        <b>Produtos</b>
                        <SetaBaixo />
                    </div>
                    <span className="anima"></span>
                </li>
                <li onClick={ (e)=> Clicado (e , ativarConteiner , "cliente") }>
                    <div className="Conteiner4RightWindowMenuTopBoxBottomLiSetaBaixo">
                        <b>Clientes</b>
                        <SetaBaixo />
                    </div>
                    <span className="anima"></span>
                </li>
                <li onClick={ (e)=> Clicado (e , ativarConteiner , "afiliado") }>
                    <div className="Conteiner4RightWindowMenuTopBoxBottomLiSetaBaixo">
                        <b>Afiliado</b>
                        <SetaBaixo />
                    </div>
                    <span className="anima"></span>
                </li>
                <li onClick={ (e)=> Clicado (e , ativarConteiner , "lucro") }>
                    <div className="Conteiner4RightWindowMenuTopBoxBottomLiSetaBaixo">
                        <b>Lucro</b>
                        <SetaBaixo />
                    </div>
                    <span className="anima"></span>
                </li>
            </div>
        </div>
    )
}