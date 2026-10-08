import { useState } from "react";
import "../css/GeralChatEstadoViewDateTexto.css"
import SetaEsquerda from "../../../../components/conteinerSvg/setaEsquerda";
import { useUserStore } from "../../../../../useUseSotore";
export default function GeralChatEstadoViewDateTexto () {
    const {setMostrarConteinerEstadoUserViews , DadosGeralEstadoUser} = useUserStore()
    return (
        <div className="GeralChatEstadoViewDateTexto">
            <div className="GeralChatEstadoViewDateTextoTXT">
                <p>
                    {DadosGeralEstadoUser.dados_estado}
                </p>
            </div>
            <div className="GeralChatEstadoViewDateTextoPerfilUsuario">
                <div className="GeralChatEstadoViewDateTextoPerfilUsuarioBox1">
                    <div className="GeralChatEstadoViewDateTextoPerfilUsuarioBox1FotoUsuario"></div>
                    <div className="GeralChatEstadoViewDateTextoPerfilUsuarioBox1Conteudo">
                        <h2>{DadosGeralEstadoUser.nome_usuario}</h2>
                        <li>Âncorando</li>
                    </div>
                </div>
                <div className="GeralChatEstadoViewDateTextoPerfilUsuarioBox2">
                    <div className="GeralChatEstadoViewDateTextoPerfilUsuarioBox2Icone">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-repeat" viewBox="0 0 16 16">
                             <path d="M11 5.466V4H5a4 4 0 0 0-3.584 5.777.5.5 0 1 1-.896.446A5 5 0 0 1 5 3h6V1.534a.25.25 0 0 1 .41-.192l2.36 1.966c.12.1.12.284 0 .384l-2.36 1.966a.25.25 0 0 1-.41-.192m3.81.086a.5.5 0 0 1 .67.225A5 5 0 0 1 11 13H5v1.466a.25.25 0 0 1-.41.192l-2.36-1.966a.25.25 0 0 1 0-.384l2.36-1.966a.25.25 0 0 1 .41.192V12h6a4 4 0 0 0 3.585-5.777.5.5 0 0 1 .225-.67Z"/>
                        </svg>
                    </div>
                    <div className="GeralChatEstadoViewDateTextoPerfilUsuarioBox2Icone">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-eye-fill" viewBox="0 0 16 16">
                            <path d="M10.5 8a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0"/>
                            <path d="M0 8s3-5.5 8-5.5S16 8 16 8s-3 5.5-8 5.5S0 8 0 8m8 3.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7"/>
                        </svg>
                    </div>
                    <div className="GeralChatEstadoViewDateTextoPerfilUsuarioBox2Icone">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-heart-fill" viewBox="0 0 16 16">
                            <path fillRule="evenodd" d="M8 1.314C12.438-3.248 23.534 4.735 8 15-7.534 4.736 3.562-3.248 8 1.314"/>
                        </svg>
                    </div>
                </div>
            </div>
            <div className="GeralChatEstadoViewDateTextoVoltar" onClick={()=>{setMostrarConteinerEstadoUserViews(false)}}>
                <SetaEsquerda />
            </div>
        </div>
    )
}
