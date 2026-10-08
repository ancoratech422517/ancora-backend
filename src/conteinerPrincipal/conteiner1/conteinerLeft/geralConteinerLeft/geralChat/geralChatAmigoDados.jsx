import { useUserStore } from "../../../../../useUseSotore"; // Ajuste o caminho da sua store
import "../css/GeralChatAmigoDados.css";
import { solicitarAmizade } from "../../../../../service/socket_service"; // Importe a função que vamos criar abaixo
import { useState } from "react";

export default function GeralChatAmigoDados({ dados }) {
    // 1. Pegamos o socket e os NOSSOS dados do Zustand
    const { socket, dadosUsuario ,urlBancoDeDados } = useUserStore();
    let valor = "none"
    if (dados.foto_usuario !== "none"){
        valor = "ativo"
    }
    const [estadoFotoPerfil , setEstadoFotoPerfil] = useState(valor)
    const condicao_estado_foto_perfil = ()=>{
        switch(estadoFotoPerfil){
            case "none":
                return (
                    <strong>{dados.nome ? dados.nome[0].toUpperCase() : "?"}</strong>
                )
            case "ativo":
                const URLIMAGE = `${dados.foto_usuario}`
                return (
                    <div className="GeralChatAmigoDadosIconeBox">
                        <img src={URLIMAGE} alt="" />
                    </div>
                )
        }
    }

    if (!dados) return null;

    const gerarGradienteElegante = (id) => {
        const coresBase = [
            ["#6a11cb", "#2575fc"], ["#ff9a9e", "#fecfef"],
            ["#00b09b", "#96c93d"], ["#434343", "#000000"]
        ];
        const parDeCores = coresBase[id % coresBase.length];
        return `linear-gradient(135deg, ${parDeCores[0]}, ${parDeCores[1]})`;
    };

    const meuGradiente = gerarGradienteElegante(dados.id);

    return (
        <div className="GeralChatAmigoDados">
            <div className="GeralChatAmigoDadosIcone" style={{ background: meuGradiente }}>
                {condicao_estado_foto_perfil()}
            </div>
            <div className="GeralChatDadosText">
                <h5>{dados.nome}</h5>
                <li>Comerciante ativo</li>
            </div>
            <div className="GeralChatAmigobtn">
                {/* 2. Chamamos a função passando o socket, nossos dados e o ID do alvo */}
                <button onClick={() => solicitarAmizade(socket, dadosUsuario, dados.id)}>
                    Adicionar
                </button>
            </div>
        </div>
    );
}