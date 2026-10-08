import { useState } from "react";
import "./css/Conteiner8ConteinerButtonBoxLeft.css"
import Mais from "../components/conteinerSvg/mais";
import Conteiner8ConteinerButtonBoxLeftDadosScroll from "./Conteiner8ConteinerButtonBoxLeftDadosScroll";
import Foto from "../components/conteinerSvg/foto";
import Video from "../components/conteinerSvg/video";
import Imoge from "../components/conteinerSvg/imoge";
import Conteiner8ConteinerButtonBoxLeftPublicacao from "./Conteiner8ConteinerButtonBoxLeftPublicacoes";
export default function Conteiner8ConteinerButtonBoxLeft () {
    return (
        <div className="Conteiner8ConteinerButtonBoxLeft">
            {/* INICIO DA FORMATAÇÃO DO PRIMEIRO MENU TOP */}
            <div className="Conteiner8ConteinerVuttonBoxLeftMenuTop">
                <b>Historia</b>
                <div className="Conteiner8ConteinerButtonBoxLeftMenuTopContScroll">
                    
                    <div className="Conteiner8ConteinerButtonBoxLeftMenuTopContScrollEstadoFixoDiv">
                        <label htmlFor="historia" className="Conteiner8ConteinerButtonBoxLeftMenuTopContScrollEstadoFixo">
                            <Mais />
                        </label>
                        <li>Adicionar</li>
                    </div>
                    <input type="file" name="historia" id="historia" style={{display: "none"}}/>
                    <div className="Conteiner8ConteinerButtonBoxLeftMenuTopContScrollEstadoFixoScrollDefinitivo">
                        <Conteiner8ConteinerButtonBoxLeftDadosScroll />
                        <Conteiner8ConteinerButtonBoxLeftDadosScroll />
                        <Conteiner8ConteinerButtonBoxLeftDadosScroll />
                        <Conteiner8ConteinerButtonBoxLeftDadosScroll />
                        <Conteiner8ConteinerButtonBoxLeftDadosScroll />
                        <Conteiner8ConteinerButtonBoxLeftDadosScroll />
                        <Conteiner8ConteinerButtonBoxLeftDadosScroll />
                        <Conteiner8ConteinerButtonBoxLeftDadosScroll />
                        <Conteiner8ConteinerButtonBoxLeftDadosScroll />
                        <Conteiner8ConteinerButtonBoxLeftDadosScroll />

                    </div>
                </div>
            </div>
            {/* FIM DA FORMATAÇÃO DO PRIMEIRO MENU TOP */}
            
            {/* INICIO DA FORMATAÇÃO DO SEGUNDO MENU TOP */}
            <div className="Conteiner8ConteinerButtonBoxLeftMenuButton">
                <div className="Conteiner8ConteinerButtonBoxLeftMenuButtonBox1">
                    <div className="Conteiner8ConteinerButtonBoxLeftMenuButtonBox1PerfilUser">
                        <li>Eu</li>
                    </div>
                </div>
                <div className="Conteiner8ConteinerButtonBoxLeftMenuButtonBox2">
                    <textarea name="" id="" placeholder="O que estas a pensar? partilha com sua rede..."></textarea>
                    <div className="Conteiner8ConteinerButtonBoxLeftMenuButtonBox2ContButton">
                        <div className="Conteiner8ConteinerButtonBoxLeftMenuButtonBox2ContButtonBox1">
                            <li> <Foto /> Foto </li>
                            <li> <Video /> Video</li>
                            <li> <Imoge /> Humor</li>
                            <li>Sondagem</li>
                        </div>
                        <div className="Conteiner8ConteinerButtonBoxLeftMenuButtonBox2ContButtonBox2">
                            <button>Publicar</button>
                        </div>
                    </div>
                </div>
            </div>
            {/* FIM DA FORMATAÇÃO DO SEFUNDO MENU TOP */}

            {/* INICIO DA FORMATAÇÃO DO CONTEINIER DOS DADOS DA PUBLICAÇÃO */}
            <Conteiner8ConteinerButtonBoxLeftPublicacao />
            <Conteiner8ConteinerButtonBoxLeftPublicacao />
            <Conteiner8ConteinerButtonBoxLeftPublicacao />
            <Conteiner8ConteinerButtonBoxLeftPublicacao />
            <Conteiner8ConteinerButtonBoxLeftPublicacao />
            <Conteiner8ConteinerButtonBoxLeftPublicacao />
            <Conteiner8ConteinerButtonBoxLeftPublicacao />
            <Conteiner8ConteinerButtonBoxLeftPublicacao />
            <Conteiner8ConteinerButtonBoxLeftPublicacao />
            <Conteiner8ConteinerButtonBoxLeftPublicacao />
            {/* FIM DA FORMATÇÃO DO CONTEINER DOS DADOS D PUBLICAÇÃO */}

        </div>
    )
}