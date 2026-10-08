import { useState } from "react";
import "../css/GeralChatEstadoUser.css"
import IMGS from "../../../../../assets/teste.png"
import { AoDigitarSelecionarTexto } from "../js/GeralChatEstadoUserAddTexto";
import { AdicionarNovaDescrção } from "../js/GeralChatEstadoUserAddTexto";
import { useUserStore } from "../../../../../useUseSotore";
import Loading3 from "../../../../components/conteinerComponentesJsx/loading3";
import { GeralChatEstadoUserAddMusicaAoDigitarDescricao } from "../js/GeralChatEstadoUserAddTexto";
import { GeralChatEstadoUserAddMusicaSendEstado } from "../js/GeralChatEstadoUserAddTexto";
import { GeralChatEstadoUserAddImagemAoDigitar } from "../js/GeralChatEstadoUserAddTexto";
import Conteiner_Animacao_Musica from "../../../../conteiner-animacao/conteiner-animacao-musica/conteiner-animacao-musica";
import ConteinerChatEstadoViewDATE from "./geralChatEstadoViewDATE";
import { GeralCharUserAddTextoAoDigitarVideo } from "../js/GeralChatEstadoUserAddTexto";
import { GeralChatEstadoUserAddImagemAoDigitarDate } from "../js/GeralChatEstadoUserAddTexto";
import { GeralChatUserAddTextoAoDigitarVideoSendVideo } from "../js/GeralChatEstadoUserAddTexto";
import SetaEsquerda from "../../../../components/conteinerSvg/setaEsquerda";
export default function GeralChatEstadoUser ({setViewChat}) {
    const {
        EstadoResposta , 
        setEstadoResposta , 
        MostrarLoadingAdicionarEstado , 
        setMostrarLoadingAdicionarEstado , 
        ConteinerDadosEstdo,
        MostrarConteinerEstadoUserViews,
        setMostrarConteinerEstadoUserViews,
        setDadosEstadoElementoClicado,
        setDadosGeralEstadoUser , 
        setTipoConteudoViewEstado,
        dadosUsuario
    } = useUserStore()
    // const [AllDateStatusUser , setAllDateStatusUser] = useState()

    const condicao_mostrar_conteiner_estado_views = () =>{
        switch(MostrarConteinerEstadoUserViews){
            case true:
                return (
                     <ConteinerChatEstadoViewDATE />
                )
        }
    }

    const condicao_estado_resposta = ()=>{
        switch(EstadoResposta){
            case true:
                return (
                        <div className="GeralChatEstadoUserAddResposta">estado enviado</div>
                )
        }
    }
    const [EstadoViewAdd , setEstadoViewAdd] = useState(false)
    const condicao_estado_view_add = () =>{
        switch(EstadoViewAdd){
            case true:
                return(
                    <div className="GeralChatEstadoUserAdd">
                        {condicao_estado_resposta()}
                        {condicao_estado_loading()}
                        <div className="GeralChatEstadoUserAddCancelar" onClick={()=>setEstadoViewAdd(false)}>Cancelar</div>
                        {condicao_tipo_estado()}
                        

                     

                    </div>
                )
        }
    }
    const condicao_estado_loading = ()=>{
        switch(MostrarLoadingAdicionarEstado){
            case true:
                return (
                    <div className="MostrarLoadingEstadoView">
                        <Loading3 />
                    </div>
                )
        }
    }
    const [TipoEstado , setTipoEstado] = useState()
    const condicao_tipo_estado = ()=>{
        switch(TipoEstado){
            case "texto":
                return (
                    <div className="GeralChatEstadoUserAddTexto">
                        <div className="GeralChatEstadoUserAddTextoGet">
                            <p id="GeralChatEstadoUserAddTextoGetIDTexto" className="GeralChatEstadoUserAddTextoGetIDTexto"></p>
                        </div>
                        <p id="tipo-estado" style={{display:"none"}}>texto</p>
                        <div className="GeralChatEstadoUserAddTextoInput">
                            <input onChange={()=>AoDigitarSelecionarTexto()} id="aodigitarSelecionar"  type="text" placeholder="Escrevi aqui..." />
                            <button onClick={()=> {AdicionarNovaDescrção( setEstadoResposta , setMostrarLoadingAdicionarEstado , setEstadoViewAdd)}} >enviar estado</button>
                        </div>
                    </div>
                )
            case "musica":
                return (
                        <div className="GeralChatEstadoUserAddMusica">
                            <p>
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-music-note-beamed" viewBox="0 0 16 16">
                                <path d="M6 13c0 1.105-1.12 2-2.5 2S1 14.105 1 13s1.12-2 2.5-2 2.5.896 2.5 2m9-2c0 1.105-1.12 2-2.5 2s-2.5-.895-2.5-2 1.12-2 2.5-2 2.5.895 2.5 2"/>
                                <path fill-rule="evenodd" d="M14 11V2h1v9zM6 3v10H5V3z"/>
                                <path d="M5 2.905a1 1 0 0 1 .9-.995l8-.8a1 1 0 0 1 1.1.995V3L5 4z"/>
                                </svg>
                            </p>
                            <div className="conteiner_descricao_musica">
                                <p id="conteiner_descricao_musicaID"></p>
                                <p style={{display:"none"}} id="tipo-musica">musica</p>
                            </div>
                            <input style={{display:"none"}} type="file" id="musica_estado" />
                            <label htmlFor="musica_estado">Carregar musica</label>
                            <input onChange={()=>GeralChatEstadoUserAddMusicaAoDigitarDescricao()}  type="text" id="descricao_musica" placeholder="Descrição.." />
                            <button onClick={()=>{GeralChatEstadoUserAddMusicaSendEstado(setEstadoViewAdd , setEstadoResposta , setMostrarLoadingAdicionarEstado)}}> Adicionar Estado</button>

                        </div>

                )
            case "imagem":
                return(
                        <div className="GeralChatEstadoUserAddImagem">
                            <p>
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-images" viewBox="0 0 16 16">
                                <path d="M4.502 9a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3"/>
                                <path d="M14.002 13a2 2 0 0 1-2 2h-10a2 2 0 0 1-2-2V5A2 2 0 0 1 2 3a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v8a2 2 0 0 1-1.998 2M14 2H4a1 1 0 0 0-1 1h9.002a2 2 0 0 1 2 2v7A1 1 0 0 0 15 11V3a1 1 0 0 0-1-1M2.002 4a1 1 0 0 0-1 1v8l2.646-2.354a.5.5 0 0 1 .63-.062l2.66 1.773 3.71-3.71a.5.5 0 0 1 .577-.094l1.777 1.947V5a1 1 0 0 0-1-1z"/>
                                </svg>
                            </p>
                            <div className="GeralChatEstadoUserAddImagemTexto">
                                <span id="GeralChatEstadoUserAddImagemDigitar"></span>
                            </div>
                            <label htmlFor="imagem_estado">Carregar Imagem</label>
                            <input type="file" id="imagem_estado" style={{display:"none"}} />
                            <input onChange={()=>{GeralChatEstadoUserAddImagemAoDigitar()}} type="text" id="texto_imagem_estado" placeholder="Digite aqui a sua descrição..." />
                            <button onClick={()=>{GeralChatEstadoUserAddImagemAoDigitarDate(setMostrarLoadingAdicionarEstado , setEstadoResposta , setEstadoViewAdd)}}>Adicionar Estado</button>
                        </div>
                    
                )
            case "video":
                return (
                    <div className="GeralChatEstadoUserAddVideo">
                            <li>
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-camera-video" viewBox="0 0 16 16">
                                <path fill-rule="evenodd" d="M0 5a2 2 0 0 1 2-2h7.5a2 2 0 0 1 1.983 1.738l3.11-1.382A1 1 0 0 1 16 4.269v7.462a1 1 0 0 1-1.406.913l-3.111-1.382A2 2 0 0 1 9.5 13H2a2 2 0 0 1-2-2zm11.5 5.175 3.5 1.556V4.269l-3.5 1.556zM2 4a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h7.5a1 1 0 0 0 1-1V5a1 1 0 0 0-1-1z"/>
                                </svg>
                            </li>
                            <div className="GeralChatEstadoUserAddVideospan">
                                <span className="textoVideo" id="textoVideo"></span>
                            </div>
                            <label htmlFor="video_estado">Carregar Video</label>
                            <input type="file" id="video_estado" style={{display:"none"}} />
                            <input onChange={()=>{GeralCharUserAddTextoAoDigitarVideo()}} type="text" placeholder="Descrição do video" id="descricao_video" />
                            <button onClick={()=>{GeralChatUserAddTextoAoDigitarVideoSendVideo(setEstadoResposta , setMostrarLoadingAdicionarEstado , setEstadoViewAdd)}}>Adicionar Estado</button>
                    </div>
                    
                )

        }
    }
    return (
        <div className="GeralChatEstadoUser">
            <div className="GeralChatEstadoUserFotoUser">
                <img src={dadosUsuario.foto_usuario} alt="" />
            </div>
            <h3>Meu estado <i></i> </h3>
            <div className="GeralChatEstadoUserSect1">
                <div className="GeralChatEstadoUserSect1Caxa" onClick={()=>{setTipoEstado("texto") , setEstadoViewAdd(true)}}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-pencil" viewBox="0 0 16 16">
                    <path d="M12.146.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1 0 .708l-10 10a.5.5 0 0 1-.168.11l-5 2a.5.5 0 0 1-.65-.65l2-5a.5.5 0 0 1 .11-.168zM11.207 2.5 13.5 4.793 14.793 3.5 12.5 1.207zm1.586 3L10.5 3.207 4 9.707V10h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.293zm-9.761 5.175-.106.106-1.528 3.821 3.821-1.528.106-.106A.5.5 0 0 1 5 12.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.468-.325"/>
                    </svg>
                </div>
                <div className="GeralChatEstadoUserSect1Caxa" onClick={()=>{setTipoEstado("musica") , setEstadoViewAdd(true)}}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-music-note-beamed" viewBox="0 0 16 16">
                    <path d="M6 13c0 1.105-1.12 2-2.5 2S1 14.105 1 13s1.12-2 2.5-2 2.5.896 2.5 2m9-2c0 1.105-1.12 2-2.5 2s-2.5-.895-2.5-2 1.12-2 2.5-2 2.5.895 2.5 2"/>
                    <path fill-rule="evenodd" d="M14 11V2h1v9zM6 3v10H5V3z"/>
                    <path d="M5 2.905a1 1 0 0 1 .9-.995l8-.8a1 1 0 0 1 1.1.995V3L5 4z"/>
                    </svg>
                </div>
                <div className="GeralChatEstadoUserSect1Caxa" onClick={()=>{setTipoEstado("imagem") , setEstadoViewAdd(true)}}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-images" viewBox="0 0 16 16">
                    <path d="M4.502 9a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3"/>
                    <path d="M14.002 13a2 2 0 0 1-2 2h-10a2 2 0 0 1-2-2V5A2 2 0 0 1 2 3a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v8a2 2 0 0 1-1.998 2M14 2H4a1 1 0 0 0-1 1h9.002a2 2 0 0 1 2 2v7A1 1 0 0 0 15 11V3a1 1 0 0 0-1-1M2.002 4a1 1 0 0 0-1 1v8l2.646-2.354a.5.5 0 0 1 .63-.062l2.66 1.773 3.71-3.71a.5.5 0 0 1 .577-.094l1.777 1.947V5a1 1 0 0 0-1-1z"/>
                    </svg>
                </div>
                <div className="GeralChatEstadoUserSect1Caxa" onClick={()=>{setTipoEstado("video") , setEstadoViewAdd(true)}}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-camera-video" viewBox="0 0 16 16">
                    <path fill-rule="evenodd" d="M0 5a2 2 0 0 1 2-2h7.5a2 2 0 0 1 1.983 1.738l3.11-1.382A1 1 0 0 1 16 4.269v7.462a1 1 0 0 1-1.406.913l-3.111-1.382A2 2 0 0 1 9.5 13H2a2 2 0 0 1-2-2zm11.5 5.175 3.5 1.556V4.269l-3.5 1.556zM2 4a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h7.5a1 1 0 0 0 1-1V5a1 1 0 0 0-1-1z"/>
                    </svg>
                </div>
            </div>
            <h2>Biblioteca</h2>
            
            <div className="GeralChatEstadoUserSetc2">
                {ConteinerDadosEstdo.map((dados)=>{
                    switch(dados.tipo_estado){
                        case "texto":
                            return (
                                    <div className="GeralChatEstadoUserSetc2Dados" onClick={()=>{setMostrarConteinerEstadoUserViews(true) , setDadosGeralEstadoUser(dados) , setTipoConteudoViewEstado("texto")}}>
                                        <div className="GeralChatEstadoUserSetc2DadosMenuTop">
                                            <p>0</p>
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-heart-fill" viewBox="0 0 16 16">
                                                <path fillRule="evenodd" d="M8 1.314C12.438-3.248 23.534 4.735 8 15-7.534 4.736 3.562-3.248 8 1.314"/>
                                            </svg>
                                            <p>0</p>
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-eye-fill" viewBox="0 0 16 16">
                                            <path d="M10.5 8a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0"/>
                                            <path d="M0 8s3-5.5 8-5.5S16 8 16 8s-3 5.5-8 5.5S0 8 0 8m8 3.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7"/>
                                            </svg>
                                        </div>
                                        <div className="GeralChatEstadoUserSetc2DadosConteinerFile">
                                            <em>{dados.dados_estado}</em>
                                        </div>
                                    </div>
                            )
                        case "musica":
                            return(
                                <div className="GeralChatEstadoUserSetc2Dados" onClick={()=>{setMostrarConteinerEstadoUserViews(true) , setDadosEstadoElementoClicado(dados.dados_estado) , setDadosGeralEstadoUser(dados) , setTipoConteudoViewEstado("musica")}}>
                                        <div className="GeralChatEstadoUserSetc2DadosMenuTop">
                                            <p>0</p>
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-heart-fill" viewBox="0 0 16 16">
                                                <path fillRule="evenodd" d="M8 1.314C12.438-3.248 23.534 4.735 8 15-7.534 4.736 3.562-3.248 8 1.314"/>
                                            </svg>
                                            <p>0</p>
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-eye-fill" viewBox="0 0 16 16">
                                            <path d="M10.5 8a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0"/>
                                            <path d="M0 8s3-5.5 8-5.5S16 8 16 8s-3 5.5-8 5.5S0 8 0 8m8 3.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7"/>
                                            </svg>
                                        </div>
                                        <div className="GeralChatEstadoUserSetc2DadosConteinerFile">
                                            {/* <audio src= {dados.dados_estado} controls autoCapitalize="" loop  ></audio> */}
                                            <Conteiner_Animacao_Musica />
                                        </div>
                                </div>
                            )
                        case "imagem":
                                    return(
                                        <div className="GeralChatEstadoUserSetc2Dados" onClick={()=>{setTipoConteudoViewEstado("imagem") , setMostrarConteinerEstadoUserViews(true) , setDadosGeralEstadoUser(dados)}}>
                                            <div className="GeralChatEstadoUserSetc2DadosMenuTop">
                                                <p>0</p>
                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-heart-fill" viewBox="0 0 16 16">
                                                    <path fillRule="evenodd" d="M8 1.314C12.438-3.248 23.534 4.735 8 15-7.534 4.736 3.562-3.248 8 1.314"/>
                                                </svg>
                                                <p>0</p>
                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-eye-fill" viewBox="0 0 16 16">
                                                <path d="M10.5 8a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0"/>
                                                <path d="M0 8s3-5.5 8-5.5S16 8 16 8s-3 5.5-8 5.5S0 8 0 8m8 3.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7"/>
                                                </svg>
                                            </div>
                                            <div className="GeralChatEstadoUserSetc2DadosConteinerFile">
                                                {/* <audio src= {dados.dados_estado} controls autoCapitalize="" loop  ></audio> */}
                                                <img src={dados.dados_estado} alt="" />
                                               
                                            </div>
                                    </div>
                                    )
                        case "video":
                            return(
                                    <div className="GeralChatEstadoUserSetc2Dados" onClick={()=>{setTipoConteudoViewEstado("video") , setMostrarConteinerEstadoUserViews(true) , setDadosGeralEstadoUser(dados)}}>
                                            <div className="GeralChatEstadoUserSetc2DadosMenuTop">
                                                <p>0</p>
                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-heart-fill" viewBox="0 0 16 16">
                                                    <path fillRule="evenodd" d="M8 1.314C12.438-3.248 23.534 4.735 8 15-7.534 4.736 3.562-3.248 8 1.314"/>
                                                </svg>
                                                <p>0</p>
                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-eye-fill" viewBox="0 0 16 16">
                                                <path d="M10.5 8a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0"/>
                                                <path d="M0 8s3-5.5 8-5.5S16 8 16 8s-3 5.5-8 5.5S0 8 0 8m8 3.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7"/>
                                                </svg>
                                            </div>
                                            <div className="GeralChatEstadoUserSetc2DadosConteinerFile">
                                                {/* <audio src= {dados.dados_estado} controls autoCapitalize="" loop  ></audio> */}
                                                <video src= {dados.dados_estado}></video>
                                               
                                            </div>
                                    </div>
                            )


                    }
    
                })}

            </div>
            {/* CONTEINER DE ADICIONAR NOVOS DADOS NO ESTADO */}
            {condicao_estado_view_add()}
            {condicao_mostrar_conteiner_estado_views()}
            <div className="GeralChatEstadoUserVoltar" onClick={()=>{setViewChat(false)}}>
                <SetaEsquerda />
            </div>

        </div>
    )
}
