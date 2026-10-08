import { useState } from "react";
import "../css/ConteinerChatEstadoViewDATE.css"

import GeraChatEstadoViewDATEAudio from "./geralChatEstadoViewDateAudio";
import GeralChatEstadoViewDateImagem from "./geralChatEstadoViewDateImagem";
import { useUserStore } from "../../../../../useUseSotore";
import GeralChatEstadoViewDateTexto from "./geralChatEstadoViewDateTexto";
import GeralChatEstadoViewDateVideo from "./geralChatEstadoViewDateVideo";
export default function ConteinerChatEstadoViewDATE () {
    const {TipoConteudoViewEstado} = useUserStore()
    const condicao_tipo_conteudo_view_estado = ()=>{
        switch(TipoConteudoViewEstado){
            case "musica":
                return (
                    <GeraChatEstadoViewDATEAudio /> 
                )
                case "imagem":
                    return (
                        <GeralChatEstadoViewDateImagem />
                    )
                case "texto":
                    return (
                        <GeralChatEstadoViewDateTexto />
                    )
                case "video":
                    return (
                        <GeralChatEstadoViewDateVideo />
                    )



        }
    }
    return (
        <div className="ConteinerChatEstadoViewDATE">
            {condicao_tipo_conteudo_view_estado()}
        </div>
    )
}
