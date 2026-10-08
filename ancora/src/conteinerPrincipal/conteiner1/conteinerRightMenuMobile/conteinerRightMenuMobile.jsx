import { useState } from "react";
import "./css/ConteinerRightMenuMobile.css"
import "./css/ConteinerRightMenuMobileTurma.css"
import Cart from "../../components/conteinerSvg/cart";
import Erro from "../../components/conteinerSvg/erro";
import ConteinerRightMenuMobileSCrollDados from "./ConteinerRightMenuMobileScrollDados";
import { useUserStore } from "../../../useUseSotore";
import { EsconderMenuMobileRight } from "../conteinerRight/js/menuMobile";
import { MenuMobileConvidarUsuarioTurma } from "../conteinerRight/js/menuMobileConvidarUsuario";
import "../conteinerRight/js/menuMobileSearchConvidados"
import { Search } from "../conteinerRight/js/menuMobileSearchConvidados";
import { MenuMobileSelecionarOpcao } from "../conteinerRight/js/menuMobileSelecao";
import { MenuMobileAgendarLive } from "../conteinerRight/js/menuMobileAgendarLive";
import { AgendaMinima } from "../../../global";
import { AtualizarContadores } from "../../../global";
import { MenuMobileAdicionarVideoAula } from "../conteinerRight/js/menuMobileAdicionarVideoAula";
import Loading4 from "../../components/conteinerComponentesJsx/loadind4";
export default function ConteinerRightMenuMobile () {
    
    const {
        ProdutoUsuarioChat , 
        ChatAtivo , 
        setMostrarChat , 
        EstadoMenuMobila,
        AlunTurma , 
        urlBancoDeDados , 
        UsuarioAncora , 
        dadosUsuario ,
        DadosTurmaAtual , 
        socket,
        set_estado_conteiner_live,
        set_Dados_Live_Ancora,
        Dados_Agenda_Turma,
        set_Dados_Agenda_Turma,
        Dados_Biblioteca_Video_Turma,
        set_EstadoConteinerVideoTurmaExibir , 
        set_Dados_Video_Atual_Click , 
        setEstadoMenuMobila,
        FalseTurma,
        setMostrarConteinerAgenda,
        mostrarConteinerAgenda,
        setMostrarConteinerUsuarioConvite,
        mostrarConteinerUsuarioConvite,
        setEstadoConteinerAdicionarVideo,
        estadoConteinerAdicionarVideo
    } = useUserStore()
    const getUrlVideo = (url) => {
      if (!url) return "";
        // Verifica se a URL já começa com http ou https
        const isUrlCompleta = url.startsWith("http://") || url.startsWith("https://");
        
        return isUrlCompleta ? url : `${urlBancoDeDados}/${url}`;
      };

    const URL_IMAGE = `${ChatAtivo?.foto_amigo}`
    const [IMAGETURMA , setIMAGETURMA] = useState(URL_IMAGE)
    const [mostrarConteiner , setMostrarConteiner] = useState("alunos")
    const [estadoMenuAdmin , setEstadoMenuAdmin] = useState(false)
    const [estadoDadosUsuario , setEstadoDadosUsuario] = useState("")
    const [texto_menssagem_resposta , set_texto_menssagem_resposta] = useState("")
    const [estadoMenssageResposta , setEstadoMenssageResposta] = useState(false)
    const [mostrar_foto_convidado , setMostrarFotoConvidado] = useState(false)
    const [foto_convidado_temporario , setFotoConvidadoTemporario] = useState("")
    const [total_aluno_online , setTotalAlunoOnline] = useState("")
    const [Progresso , setProgresso] = useState(0)
    const [estadoProgresso , setEstadoProgresso] = useState(false)
    const [textoProgresso , setTextoProgresso] = useState("Aguarde...")
    const [outroSVG , setOutroSvg] = useState(false)
    const [estadoLoadingAgendamentoLive , setestadoLoadingAgendamentoLive] = useState(false)
    const condicao_estadoLoadingAgendamentoLive = ()=>{
        switch(estadoLoadingAgendamentoLive){
            case true:
                return(
                    <Loading4 />
                )
        }
    }
    const condicaoEstadoConteinerAdicionarVideo = ()=>{
        switch(estadoConteinerAdicionarVideo){
            case true:
                return(
                    <div className="ConteinerRightMenuMobileTurmaBox2DivMenuAdminTurmaAddVideo">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-folder2" viewBox="0 0 16 16">
                            <path d="M1 3.5A1.5 1.5 0 0 1 2.5 2h2.764c.958 0 1.76.56 2.311 1.184C7.985 3.648 8.48 4 9 4h4.5A1.5 1.5 0 0 1 15 5.5v7a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 1 12.5zM2.5 3a.5.5 0 0 0-.5.5V6h12v-.5a.5.5 0 0 0-.5-.5H9c-.964 0-1.71-.629-2.174-1.154C6.374 3.334 5.82 3 5.264 3zM14 7H2v5.5a.5.5 0 0 0 .5.5h11a.5.5 0 0 0 .5-.5z"/>
                        </svg>
                        <h3>Adicionar nova aula</h3>
                        <input type="text" placeholder="Digite o tema e o numero da lição" id="tema_video" />
                        <label htmlFor="video">carregar video aula</label>
                        <input type="file" style={{display:"none"}} id="video" />
                        <button onClick={()=>{MenuMobileAdicionarVideoAula(nome_Turma,id_admin_turma , setProgresso, setEstadoProgresso , setTextoProgresso , setOutroSvg , setEstadoConteinerAdicionarVideo)}}>Adicionar Aula</button>
                        {condicaoEstadoProgresso()}
                    </div>
                )
        }
    }
    const condicaoOutroSvg = ()=>{
        switch(outroSVG){
            case true:
                return(
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-check-circle-fill" viewBox="0 0 16 16">
                    <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0m-3.97-3.03a.75.75 0 0 0-1.08.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-.01-1.05z"/>
                    </svg>
                )
            case false:
                return(
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-clock-history" viewBox="0 0 16 16">
                            <path d="M8.515 1.019A7 7 0 0 0 8 1V0a8 8 0 0 1 .589.022zm2.004.45a7 7 0 0 0-.985-.299l.219-.976q.576.129 1.126.342zm1.37.71a7 7 0 0 0-.439-.27l.493-.87a8 8 0 0 1 .979.654l-.615.789a7 7 0 0 0-.418-.302zm1.834 1.79a7 7 0 0 0-.653-.796l.724-.69q.406.429.747.91zm.744 1.352a7 7 0 0 0-.214-.468l.893-.45a8 8 0 0 1 .45 1.088l-.95.313a7 7 0 0 0-.179-.483m.53 2.507a7 7 0 0 0-.1-1.025l.985-.17q.1.58.116 1.17zm-.131 1.538q.05-.254.081-.51l.993.123a8 8 0 0 1-.23 1.155l-.964-.267q.069-.247.12-.501m-.952 2.379q.276-.436.486-.908l.914.405q-.24.54-.555 1.038zm-.964 1.205q.183-.183.35-.378l.758.653a8 8 0 0 1-.401.432z"/>
                            <path d="M8 1a7 7 0 1 0 4.95 11.95l.707.707A8.001 8.001 0 1 1 8 0z"/>
                            <path d="M7.5 3a.5.5 0 0 1 .5.5v5.21l3.248 1.856a.5.5 0 0 1-.496.868l-3.5-2A.5.5 0 0 1 7 9V3.5a.5.5 0 0 1 .5-.5"/>
                            </svg>                    
                )
            default:
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-clock-history" viewBox="0 0 16 16">
                            <path d="M8.515 1.019A7 7 0 0 0 8 1V0a8 8 0 0 1 .589.022zm2.004.45a7 7 0 0 0-.985-.299l.219-.976q.576.129 1.126.342zm1.37.71a7 7 0 0 0-.439-.27l.493-.87a8 8 0 0 1 .979.654l-.615.789a7 7 0 0 0-.418-.302zm1.834 1.79a7 7 0 0 0-.653-.796l.724-.69q.406.429.747.91zm.744 1.352a7 7 0 0 0-.214-.468l.893-.45a8 8 0 0 1 .45 1.088l-.95.313a7 7 0 0 0-.179-.483m.53 2.507a7 7 0 0 0-.1-1.025l.985-.17q.1.58.116 1.17zm-.131 1.538q.05-.254.081-.51l.993.123a8 8 0 0 1-.23 1.155l-.964-.267q.069-.247.12-.501m-.952 2.379q.276-.436.486-.908l.914.405q-.24.54-.555 1.038zm-.964 1.205q.183-.183.35-.378l.758.653a8 8 0 0 1-.401.432z"/>
                            <path d="M8 1a7 7 0 1 0 4.95 11.95l.707.707A8.001 8.001 0 1 1 8 0z"/>
                            <path d="M7.5 3a.5.5 0 0 1 .5.5v5.21l3.248 1.856a.5.5 0 0 1-.496.868l-3.5-2A.5.5 0 0 1 7 9V3.5a.5.5 0 0 1 .5-.5"/>
                            </svg>
        }
    }
    const condicaoEstadoProgresso = () =>{
        switch(estadoProgresso){
            case true:
                return(
                    <div className="ConteinerLoadingVideoAula">
                        <b>{Progresso}</b>
                        <li>
                            {condicaoOutroSvg()}
                            {textoProgresso}
                        </li>
                        <div>
                            A ancora agradece por escolheres a plantaforma certas para o ensino dos seus curso.
                            
                        </div>
                        <div className="svgVideoA">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-mortarboard-fill" viewBox="0 0 16 16">
                            <path d="M8.211 2.047a.5.5 0 0 0-.422 0l-7.5 3.5a.5.5 0 0 0 .025.917l7.5 3a.5.5 0 0 0 .372 0L14 7.14V13a1 1 0 0 0-1 1v2h3v-2a1 1 0 0 0-1-1V6.739l.686-.275a.5.5 0 0 0 .025-.917z"/>
                            <path d="M4.176 9.032a.5.5 0 0 0-.656.327l-.5 1.7a.5.5 0 0 0 .294.605l4.5 1.8a.5.5 0 0 0 .372 0l4.5-1.8a.5.5 0 0 0 .294-.605l-.5-1.7a.5.5 0 0 0-.656-.327L8 10.466z"/>
                            </svg>
                            <li>Ancora Academy agredece</li>
                        </div>
                    </div>
                )
        }
    }
    let totalAlunoOnline = 0
    let totalAluno = 0
    let sala_Turma = ""
    let nome_Turma = ""
    let id_admin_turma = ""
    let mostrar = false

    AlunTurma.filter((item)=>{
        totalAlunoOnline = item.total_aluno_online
        totalAluno = item.total_aluno
        sala_Turma = item.sala_Turma
        nome_Turma = item.nome_Turma
        id_admin_turma = item.id_admin_turma
    })
    
    if (id_admin_turma === dadosUsuario?.id){
        mostrar = true
    }
    else{
        mostrar = false
    }
    
    const condicaoBotaoAdminVies = ()=>{
        switch(mostrar){
            case true:
                return(
                    <div className="ConteinerRightMenuMobileTurmaBox2DivMenuAdminTurma" onClick={()=>{estadoMenuAdmin === false ? setEstadoMenuAdmin(true):setEstadoMenuAdmin(false) , setMostrarConteinerUsuarioConvite(false) , setMostrarConteinerAgenda(false) , setEstadoConteinerAdicionarVideo(false)}}>
                        <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" class="bi bi-layers-half" viewBox="0 0 16 16">
                        <path d="M8.235 1.559a.5.5 0 0 0-.47 0l-7.5 4a.5.5 0 0 0 0 .882L3.188 8 .264 9.559a.5.5 0 0 0 0 .882l7.5 4a.5.5 0 0 0 .47 0l7.5-4a.5.5 0 0 0 0-.882L12.813 8l2.922-1.559a.5.5 0 0 0 0-.882zM8 9.433 1.562 6 8 2.567 14.438 6z"/>
                        </svg>
                    </div>
                )
        }
        
    }
    const dados_live_ancora = {
        "sala_Turma":sala_Turma,
        "nome_usuario":dadosUsuario?.nome,
        "nome_Turma":nome_Turma
    }
    const [estadoLiveTurmaCont , setEstadoLiveTurmaCont] = useState("pendente")
    const condicaoEstadoLiveTurmaCont = (dados)=>{
        
        switch(dados.status_agenda_live){
            case "ativo":
                return(
                        <div className="ConteinerRightMenuMobileTurmaBox2DivConteinersProximasDados">
                            <div className="ConteinerRightMenuMobileTurmaBox2DivConteinersProximasDadosDiv">
                                <li>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-broadcast" viewBox="0 0 16 16">
                                    <path d="M3.05 3.05a7 7 0 0 0 0 9.9.5.5 0 0 1-.707.707 8 8 0 0 1 0-11.314.5.5 0 0 1 .707.707m2.122 2.122a4 4 0 0 0 0 5.656.5.5 0 1 1-.708.708 5 5 0 0 1 0-7.072.5.5 0 0 1 .708.708m5.656-.708a.5.5 0 0 1 .708 0 5 5 0 0 1 0 7.072.5.5 0 1 1-.708-.708 4 4 0 0 0 0-5.656.5.5 0 0 1 0-.708m2.122-2.12a.5.5 0 0 1 .707 0 8 8 0 0 1 0 11.313.5.5 0 0 1-.707-.707 7 7 0 0 0 0-9.9.5.5 0 0 1 0-.707zM10 8a2 2 0 1 1-4 0 2 2 0 0 1 4 0"/>
                                    </svg>
                                </li>
                                <b>Ao vivo Hoje</b>
                            </div>
                            <li>{dados.tema_agenda_live}</li>
                            <li>{dados.data_formatada}</li>
                            <button onClick={()=>{set_estado_conteiner_live(true),set_Dados_Live_Ancora(dados_live_ancora)}}>Entrar na Live</button>
                        </div>
                )
            case "pendente":
                return(

                        <div className="ConteinerRightMenuMobileTurmaBox2DivConteinersProximaDados2">
                            <li>{dados.tema_agenda_live}</li>
                            <div className="ConteinerRightMenuMobileTurmaBox2DivConteinersProximaDados2Cont">
                                <li>{dados.data_formatada}</li>
                                
                            </div>
                            <em className="contador" data-live-date = {dados.data_hora_agenda_live}>contando...</em>
                            <button>{dados.status_agenda_live}</button>
                            
                        </div>  
                    
                )
        }
    }

    const condicaoMostrarConteinerAgenda = ()=>{
        switch(mostrarConteinerAgenda){
            case true:
                return(
                    <div className="ConteinerRightMenuMobileTurmaBox2DivMenuAdminTurmaAgendarLive">
                        {condicao_estado_menssage_live()}               
                        <b>
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-broadcast" viewBox="0 0 16 16">
                                <path d="M3.05 3.05a7 7 0 0 0 0 9.9.5.5 0 0 1-.707.707 8 8 0 0 1 0-11.314.5.5 0 0 1 .707.707m2.122 2.122a4 4 0 0 0 0 5.656.5.5 0 1 1-.708.708 5 5 0 0 1 0-7.072.5.5 0 0 1 .708.708m5.656-.708a.5.5 0 0 1 .708 0 5 5 0 0 1 0 7.072.5.5 0 1 1-.708-.708 4 4 0 0 0 0-5.656.5.5 0 0 1 0-.708m2.122-2.12a.5.5 0 0 1 .707 0 8 8 0 0 1 0 11.313.5.5 0 0 1-.707-.707 7 7 0 0 0 0-9.9.5.5 0 0 1 0-.707zM10 8a2 2 0 1 1-4 0 2 2 0 0 1 4 0"/>
                            </svg>
                        </b>
                        <h3>Agendar uma Live</h3>
                        <input type="text" name="" id="tema_agenda_live" placeholder="Digite o Tema da Live" />
                        <input type="datetime-local" name="" id="data_hora_agenda_live" />
                        <button onClick={()=>{MenuMobileAgendarLive(sala_Turma , nome_Turma , setEstadoMenssageLive , setMostrarConteinerAgenda , id_admin_turma , set_Dados_Agenda_Turma , setestadoLoadingAgendamentoLive)}}>Agendar Live</button>
                        {condicao_estadoLoadingAgendamentoLive()}
                    </div>

                )
        }
    }
    const [estadoMenssagemLive , setEstadoMenssageLive] = useState(false)
    const condicao_estado_menssage_live = ()=>{
        switch(estadoMenssagemLive){
            case true:
                return (
                    <div className="ConteinerRightMenuMobileTurmaBox2DivMenuAdminTurmaAgendarLiveRespostaMenssage">
                        <b>agena marcada com sucsso</b>
                    </div>
                )
        }
    }
    const condicao_mostrar_foto_convidado = ()=>{
        switch(mostrar_foto_convidado){
            case true:
                return(
                <div className="ConteinerFoto">
                    <img src={foto_convidado_temporario} alt="" />
                    <div className="ConteinerFotoClose" onClick={()=>{setMostrarFotoConvidado(false)}}>voltar</div>
                </div>

                )
        }
    }
    const ativar_searc = () =>{
        Search()
    }

    const condicao_mostrar_o_conteiner = ()=>{
        mostrarConteinerUsuarioConvite === false ? setMostrarConteinerUsuarioConvite(true):setMostrarConteinerUsuarioConvite(false)
        
    }
    const condicao_mostrar_conteiner_usuario_convite = ()=>{
        
        switch(mostrarConteinerUsuarioConvite){
            case true:
                const URLIMAGETESTE = getUrlVideo(dadosUsuario.foto_usuario)
                return(
            <div className="ConteinerRightMenuMobileTurmaBox2MenuAdminTurmaConteinerAddAluno">
                <div className="ConteinerRightMenuMobileTurmaBox2MenuAdminTurmaConteinerAddAlunoMenuTop">
                    <input type="search" placeholder="Digite o nome ou o numero" id="search" />
                    <button>
                        <svg class="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-[var(--gray-600)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                        </svg>
                    </button>
                </div>
                <div className="ConteinerRightMenuMobileTurmaBox2MenuAdminTurmaConteinerAddAlunoScroll">
                   
                    {condicaoEstadoMenssageResposta()}
                    {UsuarioAncora.map((usuario , index)=>{
                        const URLIMAGE = getUrlVideo(usuario.foto_usuario)                    
                        return(
                            <div className="ConteinerRightMenuMobileTurmaBox2MenuAdminTurmaConteinerAddAlunoScrollDados">
                                <div className="ConteinerRightMenuMobileTurmaBox2MenuAdminTurmaConteinerAddAlunoScrollDadosIcone">
                                    <img src={URLIMAGE} alt="" />
                                </div>
                                <div className="ConteinerRightMenuMobileTurmaBox2MenuAdminTurmaConteinerAddAlunoScrollDadosCont">
                                    <li>{usuario.nome}</li>
                                    <b style={{display:"none"}}>{usuario.telefone}</b>
                                    <div className="ConteinerRightMenuMobileTurmaBox2MenuadminTurmaConteinerAddAlunoScrollDadosContBoxBtn">
                                        <button onClick={()=>{MenuMobileConvidarUsuarioTurma(dadosUsuario?.id,DadosTurmaAtual?.id,usuario?.id , socket , setEstadoMenssageResposta , set_texto_menssagem_resposta , DadosTurmaAtual?.nome_Turma)}}>convidar</button>
                                        <button onClick={()=>{setMostrarFotoConvidado(true) , setFotoConvidadoTemporario(URLIMAGE)}}>ver foto</button> 
                                    </div>
                                </div>
                            </div>
                        )
                    })}         
          
                </div>
                {condicao_mostrar_foto_convidado()}
            </div>

                )
        }
    }
    const condicaoEstadoMenssageResposta = ()=>{
        switch(estadoMenssageResposta){
            case true:
                return(
                    <div className="ConteinerRightMenuMobileTurmaBox2MenuAdminTurmaConteinerAddAlunoScrollMenssage">
                        <b> {texto_menssagem_resposta} </b>
                    </div>    
                )
        }
    }

    const condicaoEstadoMenuAdmin = ()=>{
        switch(estadoMenuAdmin){
            case true:
                
                return(
                    <div className="ConteinerRightMenuMobileTurmaBox2DivMenuAdminTurmaConteiner">
                        <div className="ConteinerRightMenuMobileTurmaBox2DivMenuTurmaConteinerImageTurma">
                            <img src={URL_IMAGE} alt="" />
                        </div>
                        <div className="ConteinerRightMenuMobileTurmaBox2DivMenuTurmaConteinerBtnTurma">
                            <button onClick={()=>{condicao_mostrar_o_conteiner() , setTimeout(() => {
                                ativar_searc()
                            }, 2000); setEstadoMenuAdmin(false)}}>
                                Adicionar novo aluno
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-person-fill" viewBox="0 0 16 16">
                                <path d="M3 14s-1 0-1-1 1-4 6-4 6 3 6 4-1 1-1 1zm5-6a3 3 0 1 0 0-6 3 3 0 0 0 0 6"/>
                                </svg>
                            </button>
                            <button onClick={()=>{setMostrarConteinerAgenda(true) , setEstadoMenuAdmin(false) , setTimeout(() => {
                                AgendaMinima()
                            }, 1000);}}>
                                Agendar nova live
                               <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" class="bi bi-broadcast" viewBox="0 0 16 16">
                                   <path d="M3.05 3.05a7 7 0 0 0 0 9.9.5.5 0 0 1-.707.707 8 8 0 0 1 0-11.314.5.5 0 0 1 .707.707m2.122 2.122a4 4 0 0 0 0 5.656.5.5 0 1 1-.708.708 5 5 0 0 1 0-7.072.5.5 0 0 1 .708.708m5.656-.708a.5.5 0 0 1 .708 0 5 5 0 0 1 0 7.072.5.5 0 1 1-.708-.708 4 4 0 0 0 0-5.656.5.5 0 0 1 0-.708m2.122-2.12a.5.5 0 0 1 .707 0 8 8 0 0 1 0 11.313.5.5 0 0 1-.707-.707 7 7 0 0 0 0-9.9.5.5 0 0 1 0-.707zM10 8a2 2 0 1 1-4 0 2 2 0 0 1 4 0"/>
                               </svg>
                            </button>
                            <button onClick={()=>{setEstadoConteinerAdicionarVideo(true) , setEstadoMenuAdmin(false)}}>
                                adicionar nova lição
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-camera-video-fill" viewBox="0 0 16 16">
                                <path fill-rule="evenodd" d="M0 5a2 2 0 0 1 2-2h7.5a2 2 0 0 1 1.983 1.738l3.11-1.382A1 1 0 0 1 16 4.269v7.462a1 1 0 0 1-1.406.913l-3.111-1.382A2 2 0 0 1 9.5 13H2a2 2 0 0 1-2-2z"/>
                                </svg>
                            </button>
                        </div>
                    </div>
                )
        }
    }
    const condicaoMostrarConteiner = ()=>{
        switch(mostrarConteiner){

            case "alunos":
                        return (
                        <div className="ConteinerRightMenuMobileTurmaBox2DivConteiners">
                            <div className="ConteinerRightMenuMobileTurmaBox2DivConteinersAlunos">
                                <div className="ConteinerRightMenuMobileTurmaBox2DivConteinersAlunosMenuTop">
                                    <li>Online agora ({totalAlunoOnline}) </li>
                                </div>
                                <div className="ConteinerRightMenuMobileTurmaBox2DivConteinersAlunosScroll">
                                    {AlunTurma.map((dados , index)=>{
                                        const URLIMAGE = getUrlVideo(dados.foto_aluno)
                                        
                                        return(
                                            <div className="ConteinerRightMenuMobileTurmaBox2DivConteinersAlunosScrollDados">
                                                <div className="ConteinerRightMenuMobileTurmaBox2DivConteinersAlunosScrollDadosIcone">
                                                    <img src={URLIMAGE} alt="" />
                                                </div>
                                                <div className="ConteinerRightMenuMobileTurmaBox2DivConteinersAlunosScrollDadosCont">
                                                    <b>{dados.nome_aluno}</b>
                                                    <li style={{color: dados.status === "Online" ? "#008080":"gray"}}>{dados.status}</li>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        </div>

                        )                    
                
            case "proximas":
                return (
                    <div className="ConteinerRightMenuMobileTurmaBox2DivConteinersProximas">
                        {Dados_Agenda_Turma.map((dados)=>{
                            return(
                                condicaoEstadoLiveTurmaCont(dados)
                            )
                        })}
                    </div>
                    
                )
            case "biblioteca":
                
                return (
                    <div className="ConteinerRightMenuMobileTurmaBox2DivConteinersProximaDados3">
                        <div className="ConteinerRightMenuMobileTurmaBox2DivConteinersProximaDados3MenuTop">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-folder2" viewBox="0 0 16 16">
                                <path d="M1 3.5A1.5 1.5 0 0 1 2.5 2h2.764c.958 0 1.76.56 2.311 1.184C7.985 3.648 8.48 4 9 4h4.5A1.5 1.5 0 0 1 15 5.5v7a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 1 12.5zM2.5 3a.5.5 0 0 0-.5.5V6h12v-.5a.5.5 0 0 0-.5-.5H9c-.964 0-1.71-.629-2.174-1.154C6.374 3.334 5.82 3 5.264 3zM14 7H2v5.5a.5.5 0 0 0 .5.5h11a.5.5 0 0 0 .5-.5z"/>
                            </svg>
                            <li>Videos Da Turma</li>
                        </div>
                        <div className="ConteinerRightMenuMobileTurmaBox2DivConteinersProximaDados3Scroll">
                            {Dados_Biblioteca_Video_Turma.map((dados)=>{
                                
                                return(
                                    <div onClick={()=>{set_EstadoConteinerVideoTurmaExibir(true) , set_Dados_Video_Atual_Click(dados.url_video)}} className="ConteinerRightMenuMobileTurmaBox2DivConteinersProximaDados3ScrollDados">
                                        <div className="ConteinerRightMenuMobileTurmaBox2DivConteinersProximaDados3ScrollDadosMedia">
                                            <video src={getUrlVideo(dados.url_video)} controls ></video>
                                        </div>
                                        <div className="ConteinerRightMenuMobileTurmaBox2DivConteinersProximaDados3ScrollDadosCont">
                                            <li>{dados.tema_video}</li>
                                            <li>12min - 37 visualização</li>
                                        </div>
                                    </div>
                                )    
                            })}
                            
                        </div>
                    </div>
                )
        }
    }
    const condicaoEstadoMenuMobile = () => {
        switch(EstadoMenuMobila){
            case "normal":
                return(
                    <div className="ConteinerRightMenuMobileScroll">
                        {Array.isArray(ProdutoUsuarioChat) && ProdutoUsuarioChat.length > 0 ? (
                            ProdutoUsuarioChat.map((item , index)=>(
                                <ConteinerRightMenuMobileSCrollDados
                                    key={index}
                                    dados = {item}
                                />
                            ))
                        ):(
                            <p style={{ color: "gray", textAlign: "center", width: "100%", padding: "60px 20px" }}>
                                    A estore do seu amigo esta vazia
                            </p>
                        )}
                        
                    </div>

                )
            case "turma":
                return(
                        <div className="ConteinerRightMenuMobileTurma">
                            <div className="ConteinerRightMenuMobileTurmaBox1">
                                <div className="ConteinerRightMenuMobileTurmaBox1Caxa">
                                    <div className="ConteinerRightMenuMobileTurmaBox1CaxaDados">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-person-fill" viewBox="0 0 16 16">
                                        <path d="M3 14s-1 0-1-1 1-4 6-4 6 3 6 4-1 1-1 1zm5-6a3 3 0 1 0 0-6 3 3 0 0 0 0 6"/>
                                        </svg>
                                        <li>Alunos</li>
                                    </div>
                                    <div className="ConteinerRightMenuMobileTurmaBox1CaxaDados">
                                        <strong>{totalAluno}</strong>
                                    </div>
                                </div>
                                <div className="ConteinerRightMenuMobileTurmaBox1Caxa">
                                    <div className="ConteinerRightMenuMobileTurmaBox1CaxaDados">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-graph-up-arrow" viewBox="0 0 16 16">
                                        <path fill-rule="evenodd" d="M0 0h1v15h15v1H0zm10 3.5a.5.5 0 0 1 .5-.5h4a.5.5 0 0 1 .5.5v4a.5.5 0 0 1-1 0V4.9l-3.613 4.417a.5.5 0 0 1-.74.037L7.06 6.767l-3.656 5.027a.5.5 0 0 1-.808-.588l4-5.5a.5.5 0 0 1 .758-.06l2.609 2.61L13.445 4H10.5a.5.5 0 0 1-.5-.5"/>
                                        </svg>
                                        <li>Engajamento</li>
                                    </div>
                                    <div className="ConteinerRightMenuMobileTurmaBox1CaxaDados">
                                        <strong>87%</strong>
                                    </div>
                                </div>
                                
                            </div>

                            <div className="ConteinerRightMenuMobileTurmaBox2">
                                <div className="ConteinerRightMenuMobileTurmaBox2Div">
                                    <b>Progresso Geral</b>
                                    <li>72%</li>
                                </div>
                                <div className="ConteinerRightMenuMobileTurmaBox2Div">
                                    <div className="ConteinerRightMenuMobileTurmaBox2DivLoading">
                                        <div className="ConteinerRightMenuMobileTurmaBox2DivLoadingLiquido"></div>
                                    </div>
                                </div>
                                <div className="ConteinerRightMenuMobileTurmaBox2Div">
                                    <li>17 de 30 aulas concluidas</li>
                                </div>
                            </div>

                            <div className="ConteinerRightMenuMobileTurmaBox2DivMenu">
                                <div onClick={(e)=>{MenuMobileSelecionarOpcao(e) , setMostrarConteiner("alunos")}} className="ConteinerRightMenuMobileTurmaBox2DivMenuText borda_menu">Alunos</div>
                                <div onClick={(e)=>{MenuMobileSelecionarOpcao(e) , setMostrarConteiner("proximas") , setTimeout(() => {
                                    AtualizarContadores()
                                }, 1000);}} className="ConteinerRightMenuMobileTurmaBox2DivMenuText">Proximas</div>
                                <div onClick={(e)=>{MenuMobileSelecionarOpcao(e) , setMostrarConteiner("biblioteca")}} className="ConteinerRightMenuMobileTurmaBox2DivMenuText">Biblioteca</div>
                            </div>
                            
                            {condicaoMostrarConteiner()}
                            {condicaoBotaoAdminVies()}
                        </div>

                )
        }
    }
    return (
        <div className="ConteinerRightMenuMobile">
            <div className="ConteinerRightMenuTopMobile">
                <div className="ConteinerRightMenuMobileBox1">
                    <h4>{ChatAtivo?.nome_amigo}</h4>
                    <li>
                        <Cart />
                        <b>MarketPlace</b>
                    </li>
                </div>
                <div className="ConteinerRightMenuMobileBox2" onClick={ ()=> EsconderMenuMobileRight(setMostrarChat)}>
                    <Erro />
                </div>
            </div>
            {condicaoEstadoMenuMobile()}
            {condicaoMostrarConteinerAgenda()}
            {condicao_mostrar_conteiner_usuario_convite()}           
            {condicaoEstadoMenuAdmin()}
            {condicaoEstadoConteinerAdicionarVideo()}
            
        </div>
    )
}