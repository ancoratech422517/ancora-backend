import { useState } from "react";
import "../css/GeralChatDados.css"
import { DadosActive } from "../js/geralChatDadosAction";
import { useUserStore } from "../../../../../useUseSotore";

export default function GeralChatDados ({dados, quantidade_menssagem_lida}) {
    // REMOVIDO: socket daqui
    const { 
        setChatAtivo, 
        dadosUsuario, 
        ChatAtivo, 
        setMenssagemLida, 
        setProdutoUsuarioChat, 
        setMostrarChat , 
        urlBancoDeDados ,
        setEstadoMenuMobila,
        setMostrarConteinerAgenda,
        setMostrarConteinerUsuarioConvite,
        setEstadoConteinerAdicionarVideo,
        Negritar
    } = useUserStore()
    let valor = "none"
    if(dados.foto_amigo !== "none"){
        valor = "ativo"
    }
    const getUrlVideo = (url) => {
      if (!url) return "";
        // Verifica se a URL já começa com http ou https
        const isUrlCompleta = url.startsWith("http://") || url.startsWith("https://");
        
        return isUrlCompleta ? url : `${urlBancoDeDados}/${url}`;
      };

    const [estadoFotoPerfil , setEstadoFotoPerfil] = useState(valor)
    const condicao_estado_perfil = ()=>{
        switch(estadoFotoPerfil){
            case "none":
                return (
                    <h4>{iniciais}</h4>
                )
            case "ativo":
                const URLIMAGE = `${getUrlVideo(dados.foto_amigo)}`
                return (
                    <div className="GeralChatDadosIconeValueBox">
                        <img src={URLIMAGE} alt="" />
                    </div>
                )
        }
    }
    const iniciais = dados?.nome
       ? dados.nome.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase()
        : "??";

    const gerarGradienteElegante = (id) => {
        const coresBase = [
            ["#11cb7e", "#25fcee"], ["#9aceff", "#cffedb"],
            ["#00b09b", "#067b7f"], ["#00b3ff", "#49d4a3"]
        ];
        const parDeCores = coresBase[id % coresBase.length];
        return `linear-gradient(135deg, ${parDeCores[0]}, ${parDeCores[1]})`;
    };

    const meuGradiente = gerarGradienteElegante(dados.id_amigo);

    const entrarNaSala = (e) => {
        const socketAtual = useUserStore.getState().socket // PEGA SOCKET AGORA
        setEstadoMenuMobila("normal")
        setMostrarConteinerAgenda(false)
        setMostrarConteinerUsuarioConvite(false)
        setEstadoConteinerAdicionarVideo(false)
        if (!socketAtual?.connected) {
            console.log("❌ Socket não conectado ainda. Tentando reconectar...")
            useUserStore.getState().conectarSocket() // Força conectar
            alert("Conectando ao chat, tenta de novo em 1s")
            return
        }

        console.log("✅ Entrando na sala com socket:", socketAtual.id)
        DadosActive(
            e,
            dados.nome,
            dados.id_amigo,
            dados.nossa_sala,
            dados.foto_amigo,
            setChatAtivo,
            socketAtual, // USA O SOCKET FRESCO
            dadosUsuario.id,
            dadosUsuario.nome,
            dadosUsuario.foto_usuario,
            ChatAtivo?.nossa_sala,
            setMenssagemLida,
            setProdutoUsuarioChat,
            setMostrarChat,
            
        )
    }
    let classeQuantidadeMenssagemLida = `GeralChatDadosObjectNewMenssage sala_${dados.nossa_sala}`
    let idHoraMenssagem = `hora_mensagem_${dados.nossa_sala}`
    let index = `index_${dados.nossa_sala}`

    return (
        <div className="GeralChatDados" onClick={entrarNaSala} id={index}>
            <div className="GeralChatDadosIcone">
                <div className="GeralChatDadosIconeValue" style={{background:meuGradiente }}>
                    {condicao_estado_perfil()}
                    <div className="pontoPonto"></div>
                </div>
            </div>
            <div className="GeralChatDadosTexto">
                <b>{dados.nome}</b>
                <li id={dados.nossa_sala} className={dados.nossa_sala} style={{color:`${quantidade_menssagem_lida !== 0 ? "black":"#6b7280"}` , fontWeight:`${quantidade_menssagem_lida !== 0 ? "bold":"500"}`}} >{dados.ultima_menssagem}</li>
            </div>
            <div className="GeralChatDadosObject">
                <h5 id={idHoraMenssagem}>{dados.HoraMenssagem}</h5>
                {quantidade_menssagem_lida!== 0 && (
                    <div className="GeralChatDadosObjectNewMenssage" id= {classeQuantidadeMenssagemLida} >
                        {quantidade_menssagem_lida}
                    </div>
                )}
            </div>
        </div>
    )
}