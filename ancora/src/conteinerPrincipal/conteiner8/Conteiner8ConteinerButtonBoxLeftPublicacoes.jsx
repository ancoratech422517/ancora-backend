import { useState } from "react";
import "./css/Conteiner8ConteinerButtonBoxLeftPublicacao.css"
export default function Conteiner8ConteinerButtonBoxLeftPublicacao () {
    return (
        <div className="Conteiner8ConteinerButtonBoxLeftPublicacao">
            <div className="Conteiner8ConteinerButtonBoxLeftPublicacaoBox1">
                <div className="Conteiner8ConteinerButtonBoxLeftPublicacaoBox1Perfil">
                    <li>CA</li>
                </div>
                <div className="Conteiner8ConteinerButtonBoxLeftPublicacaoBox1Cont">
                    <b>Cláudio Avelino</b>
                    <li>há 5 min · Luanda, Angola · 🌍</li>
                </div>
            </div>
            <div className="Conteiner8ConteinerButtonBoxLeftPublicacaoBox2">
                <li>
                    Lorem ipsum dolor sit amet, consectetur adipisicing elit. Inventore provident aperiam ullam animi consequuntur, eligendi dolor! Numquam ullam voluptate, quia eos sunt magni, ad cum magnam doloremque nulla hic iure?
                </li>
            </div>
            <div className="Conteiner8ConteinerButtonBoxLeftPublicacaoBox3">
                <button>❤️ 30</button>
                <button>😄 17 </button>
                <button>🔥 58</button>
                <button>👏 65</button>
            </div>
            <div className="Conteiner8ConteinerButtonBoxLeftPublicacaoBox4">
                <li>
                    <svg viewBox="0 0 24 24" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78z"/></svg>
                     Curtir
                </li>
                <li>
                    <svg viewBox="0 0 24 24" fill="none" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                    Comentario
                </li>
                <li>
                    <svg viewBox="0 0 24 24" fill="none" stroke-width="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
                    Partilhar
                </li>
                <li>
                    <svg viewBox="0 0 24 24" fill="none" stroke-width="2">
                        <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
                    </svg>
                    Guardar
                </li>
            </div>
        </div>
    )
}