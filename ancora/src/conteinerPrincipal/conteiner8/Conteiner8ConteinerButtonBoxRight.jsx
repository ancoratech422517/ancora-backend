import { useState } from "react";
import "./css/Conteiner8ConteinerButtonBoxRight.css"
import Img from "../../assets/fundo2.jpg"
import Conteiner8ConteinerButtonBoxRightSugestaoDados from "./Conteiner8ConteinerButtonBoxRightSugestaoDados";
export default function Conteiner8ConteinerButtonBoxRight () {
    return (
        <div className="Conteiner8ConteinerButtonBoxRight">
            <div className="Conteiner8ConteinerButtonBoxRightPerfilUsuario">
                <div className="Conteiner8ConteinerButtonBoxRightPerfilUsuarioBox1">
                    <div className="Conteiner8ConteinerButtonBoxRightPerfilUsuarioBox1Foto"></div>
                    <div className="Conteiner8ConteinerButtonBoxRightPerfilUsuarioBox1Text">
                        <b>Cláudio Avelino</b>
                        <li>@Cláudio-Avelino.ancora</li>
                    </div>
                </div>
                <div className="Conteiner8ConteinerButtonBoxRightPerfilUsuarioBox2">
                    <li>Perfil</li>
                </div>
            </div>
            <div className="Conteiner8ConteinerButtonBoxRightSugestao">
                <div className="Conteiner8ConteinerButtonBoxRightSugestaoTitle">
                    <b>Sugestões para ti</b>
                    <li>Ver tudo</li>
                </div>

                <Conteiner8ConteinerButtonBoxRightSugestaoDados />
                <Conteiner8ConteinerButtonBoxRightSugestaoDados />
                <Conteiner8ConteinerButtonBoxRightSugestaoDados />
                <Conteiner8ConteinerButtonBoxRightSugestaoDados />
                <Conteiner8ConteinerButtonBoxRightSugestaoDados />

            </div>
        </div>
    )
}