import { useState } from "react";
import "../css/GeralChatDados.css"
import { DadosActive } from "../js/geralChatDadosAction";
import { useUserStore } from "../../../../../useUseSotore";

export default function GeralChatDados ({dados, quantidade_menssagem_lida}) {
    // REMOVIDO: socket daqui
    const { setChatAtivo, dadosUsuario, ChatAtivo, setMenssagemLida, setProdutoUsuarioChat, setMostrarChat , urlBancoDeDados } = useUserStore()
    let valor = "none"
    if(dados.foto_amigo !== "none"){
        valor = "ativo"
    }
    const [estadoFotoPerfil , setEstadoFotoPerfil] = useState(valor)
    const condicao_estado_perfil = ()=>{
        switch(estadoFotoPerfil){
            case "none":
                return (
                    <h4>{iniciais}</h4>
                )
            case "ativo":
                const URLIMAGE = `${dados.foto_amigo}`
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
            setMostrarChat
        )
    }

    return (
        <div className="GeralChatDados" onClick={entrarNaSala}>
            <div className="GeralChatDadosIcone">
                <div className="GeralChatDadosIconeValue" style={{background:meuGradiente }}>
                    {condicao_estado_perfil()}
                </div>
            </div>
            <div className="GeralChatDadosTexto">
                <b>{dados.nome}</b>
                <li>quero este iphone 12</li>
            </div>
            <div className="GeralChatDadosObject">
                <h5>12:27</h5>
                {quantidade_menssagem_lida!== 0 && (
                    <div className="GeralChatDadosObjectNewMenssage">
                        {quantidade_menssagem_lida}
                    </div>
                )}
            </div>
        </div>
    )
}