import { useState } from "react";   
import "./css/Conteiner7.css"
import Conteiner7Menu from "./conteiner7MenuTop";
import Conteiner7Scroll from "./conteiner7Scroll";
import { useUserStore } from "../../useUseSotore";
import BoxDetalhes1 from "./NotificacaoDetalhe/boxDetalhes1";
import BoxDetalhes2 from "./NotificacaoDetalhe/boxDetalhes2";
import BoxDetalhes3 from "./NotificacaoDetalhe/boxDetalhes3";
export default function Conteiner7 ({setViewChat}) {
    
    const {AtivarDetalhes, DetalhesProduto , setAtivarDetalhes , urlBancoDeDados} = useUserStore()
        const getUrlVideo = (url) => {
        if (!url) return "";
            // Verifica se a URL já começa com http ou https
            const isUrlCompleta = url.startsWith("http://") || url.startsWith("https://");
            
            return isUrlCompleta ? url : `${urlBancoDeDados}/${url}`;
        };

    const condicaoMostrarDetalhe = ()=>{
        switch(AtivarDetalhes){
            case "True":
                const URLFOTOUSUARIO = `${getUrlVideo(DetalhesProduto.foto_usuario)}`
                switch(DetalhesProduto.tipo_notificacao || ""){
                    case "ancora_ecommerce_trafego":
                        return (
                            <BoxDetalhes2 DetalhesProduto={DetalhesProduto} />
                        )
                    case "deposito":
                        return (
                            <BoxDetalhes3 DetalhesProduto={DetalhesProduto} />
                        )
                    default:
                        return (
                             <BoxDetalhes1 DetalhesProduto={DetalhesProduto} />
                         )
                }

        }
    }

    return (
        <div className="Conteiner7">
            <Conteiner7Menu setViewChat = {setViewChat} />
            <Conteiner7Scroll />
            <div className="Menssagem_modal_notificacao">
                <b>Notificação Eliminada 📧</b>
            </div>
            {condicaoMostrarDetalhe()}
            {/* <BoxDetalhes3 /> */}
        </div>
    )
}