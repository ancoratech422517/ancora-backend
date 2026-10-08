import { useCallback, useState } from "react";
import "../css/GeralConteinerPrincipalLeft.css";
import GeralChat from "./geralChat";
import GeralChatAmigo from "./geralChatAmigo";
import Conteiner7 from "../../../../conteiner7/conteiner7";
import "../css/GeralChatTurma.css";
import GeralChatEstadoUser from "./geralChatEstdoUser";
import { useUserStore } from "../../../../../useUseSotore";
import { DadosActive } from "../js/geralChatDadosAction";

export default function GeralConteinerPrincialLeft () {
    const [viwChat, setViewChat] = useState("chat");
    const {
        dadosUsuario, 
        TurmaUsuario, 
        setChatAtivo, 
        ChatAtivo, 
        setMenssagemLida, 
        setProdutoUsuarioChat, 
        setMostrarChat,
        setDadosTurma,
        urlBancoDeDados,
        setAlunTurma,
        AlunTurma , 
        setDadosTurmaAtual,
        set_Dados_Agenda_Turma,
        set_Dados_Biblioteca_Video_Turma,
        Dados_Biblioteca_Video_Turma,
        setEstadoMenuMobila
    } = useUserStore();
    const getUrlVideo = (url) => {
      if (!url) return "";
        // Verifica se a URL já começa com http ou https
        const isUrlCompleta = url.startsWith("http://") || url.startsWith("https://");
        
        return isUrlCompleta ? url : `${urlBancoDeDados}/${url}`;
      };

    const URLIMAGE = getUrlVideo(dadosUsuario.foto_usuario)
    const [mostrar_conteiner_cursos, setmostrarConteinerCurso] = useState(false);
    const buscar_aluno_turma = useCallback((nome_Turma , id_admin_Turma)=>{
        
        fetch(`${urlBancoDeDados}/buscar_aluno_turma/${nome_Turma}/${id_admin_Turma}`)
        .then(dados=> dados.json())
        .then(dados=>{
            setAlunTurma(dados)
        })
    } , [setAlunTurma])
    //buscar a agenda das live da turma
    const buscar_agenda_turma = useCallback((nome_turma , id_admin_turma)=>{
        fetch(`${urlBancoDeDados}/buscar_agenda_turma/${nome_turma}/${id_admin_turma}`)
        .then(res=>res.json())
        .then(dados=>{
            set_Dados_Agenda_Turma(dados)
        })
    } , [set_Dados_Agenda_Turma])
    //buscar os videos da turma
    const buscar_video_turma = useCallback((nome_turma , id_admin_turma)=>{
        fetch(`${urlBancoDeDados}/buscar_video_turma/${nome_turma}/${id_admin_turma}`)
        .then(res=> res.json())
        .then(dados=>{
            set_Dados_Biblioteca_Video_Turma(dados)
        })

    } , [set_Dados_Biblioteca_Video_Turma])

    // ALTERADO: Agora recebemos a 'turmaSelecionada' diretamente no clique
    const entrar_na_turma = (e, turmaSelecionada , setmostrarConteinerCurso) => {
        const socketAtual = useUserStore.getState().socket;
        
        if(!turmaSelecionada.id_admin_Turma){
           
            setEstadoMenuMobila("normal")
        }
        else{
            setEstadoMenuMobila("turma")
        }
        
        setDadosTurma(turmaSelecionada)
        buscar_aluno_turma(turmaSelecionada.nome_Turma , turmaSelecionada.id_admin_Turma)
        buscar_agenda_turma(turmaSelecionada.nome_Turma , turmaSelecionada.id_admin_Turma)
        buscar_video_turma(turmaSelecionada.nome_Turma , turmaSelecionada.id_admin_Turma)
        // Correção de segurança igual ao chat privado
        if (!socketAtual || !socketAtual.connected) {
            useUserStore.getState().conectarSocket();
            console.log("Conectando ao socket da turma...");
            return;
        }
        setmostrarConteinerCurso(false)
            //sala_Turma
        console.log("✅ Entrando na sala de grupo:", turmaSelecionada.sala_Turma);
        //adicionar os dados da turma actual na store apos ao clique
        setDadosTurmaAtual(turmaSelecionada)
        // Chamando a ação com os dados EXCLUSIVOS da turma clicada
        DadosActive(
            e,
            turmaSelecionada.nome_Turma,          // nome
            turmaSelecionada.id_aluno_Turma,     // id do destino/turma
            turmaSelecionada.sala_Turma,         // a sala correta do Socket.io
            turmaSelecionada.imagem_perfil_Turma, // foto
            setChatAtivo, 
            socketAtual,
            dadosUsuario.id,
            dadosUsuario.nome,
            dadosUsuario.foto_usuario,
            ChatAtivo?.nossa_sala,               // Boa prática: passar a sala anterior se houver
            setMenssagemLida,
            setProdutoUsuarioChat, 
            setMostrarChat,
            urlBancoDeDados
        );
    };

    const dadosTurma = () => {
        if (!TurmaUsuario) return null;
        
        return TurmaUsuario.map((turma, index) => {
            const URLIMAGE_TURMA = `${urlBancoDeDados}/${turma.imagem_perfil_Turma}`;
            return (
                /* ALTERADO: Passando uma arrow function para enviar a 'turma' atual no clique */
                <div 
                    key={turma.id || index} 
                    className="widgetConteinerTurmaMenuTopScrollDados" 
                    onClick={(e) => entrar_na_turma(e, turma , setmostrarConteinerCurso)}
                >
                    <div className="widgetConteinerTurmaMenuTopScrollDadosIcone">
                        <img src={getUrlVideo(turma.imagem_perfil_Turma)} alt="" />
                    </div>
                    <div className="widgetConteinerTurmaMenuTopScrollDadosConteudo">
                        <b>{turma.nome_Turma}</b>
                        <li>aprenda ao seu ritmo</li>
                    </div>
                </div>
            );
        });
    };

    const condição_conteiner_curso = () => {
        if (mostrar_conteiner_cursos) {
            return (
                <div className="widgetConteinerTurma">
                    <div className="widgetConteinerTurmaMenuTop">
                        <div className="widgetConteinerTurmaMenuTopIcone">
                            <img src={URLIMAGE} alt="" />
                        </div>
                        <div className="widgetConteinerTurmaMenuTopConteudo">
                            <b>{dadosUsuario.nome}</b>
                            <li>Faça bom proveito da sua formação</li>
                        </div>
                    </div>
                    <div className="widgetConteinerTurmaMenuTopScroll">
                        {dadosTurma()}
                    </div>
                </div>
            );
        }
        return null;
    };

    const ViewAba = () => {
        switch(viwChat){
            case "chat": return <GeralChat setViewChat={setViewChat}/>;
            case "amigo_chat": return <GeralChatAmigo setViewChat={setViewChat} />;
            case "conteiner7": return <Conteiner7 setViewChat={setViewChat} />;
            case "estado_usuario": return <GeralChatEstadoUser setViewChat={setViewChat} />

            default: return <GeralChat setViewChat={setViewChat} />;
        }
    };

    return (
        <div className="GeralConteinerPrincipalLeft">
            {ViewAba()}
            <div className="widgetTurma" onClick={() => setmostrarConteinerCurso(!mostrar_conteiner_cursos)}>
                <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" className="bi bi-shop" viewBox="0 0 16 16">
                    <path d="M2.97 1.35A1 1 0 0 1 3.73 1h8.54a1 1 0 0 1 .76.35l2.609 3.044A1.5 1.5 0 0 1 16 5.37v.255a2.375 2.375 0 0 1-4.25 1.458A2.37 2.37 0 0 1 9.875 8 2.37 2.37 0 0 1 8 7.083 2.37 2.37 0 0 1 6.125 8a2.37 2.37 0 0 1-1.875-.917A2.375 2.375 0 0 1 0 5.625V5.37a1.5 1.5 0 0 1 .361-.976zm1.78 4.275a1.375 1.375 0 0 0 2.75 0 .5.5 0 0 1 1 0 1.375 1.375 0 0 0 2.75 0 .5.5 0 0 1 1 0 1.375 1.375 0 1 0 2.75 0V5.37a.5.5 0 0 0-.12-.325L12.27 2H3.73L1.12 5.045A.5.5 0 0 0 1 5.37v.255a1.375 1.375 0 0 0 2.75 0 .5.5 0 0 1 1 0M1.5 8.5A.5.5 0 0 1 2 9v6h1v-5a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1v5h6V9a.5.5 0 0 1 1 0v6h.5a.5.5 0 0 1 0 1H.5a.5.5 0 0 1 0-1H1V9a.5.5 0 0 1 .5-.5M4 15h3v-5H4zm5-5a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-2a1 1 0 0 1-1-1zm3 0h-2v3h2z"/>
                </svg>
            </div>
            {condição_conteiner_curso()}
        </div>
    );
}