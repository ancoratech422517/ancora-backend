import { useUserStore } from "../../../../../useUseSotore"; // Ajuste o caminho da sua store
import "../css/GeralChatAmigoDados.css";
import { solicitarAmizade } from "../../../../../service/socket_service"; // Importe a função que vamos criar abaixo
import { useState } from "react";
import { GeralChatAmigoDadosPerfil } from "../js/geralChatAmigoDados";

export default function GeralChatAmigoDados({ dados }) {
    // 1. Pegamos o socket e os NOSSOS dados do Zustand
    const { socket, dadosUsuario ,urlBancoDeDados ,setFotoPerfilUsuario} = useUserStore();
    const getUrlVideo = (url) => {
      if (!url) return "";
        // Verifica se a URL já começa com http ou https
        const isUrlCompleta = url.startsWith("http://") || url.startsWith("https://");
        
        return isUrlCompleta ? url : `${urlBancoDeDados}/${url}`;
      };

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
                const URLIMAGE = `${getUrlVideo(dados.foto_usuario)}`
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

    let classe = `GeralChatAmigoDadosresposta flex_${dados.id}`


    return (
        <div className="GeralChatAmigoDados">
            <div className="GeralChatAmigoDadosIcone" style={{ background: meuGradiente }}>
                {condicao_estado_foto_perfil()}
            </div>
            <div className="GeralChatDadosText">
                <b>{dados.nome}</b>
                <div className="GeralChatDadosTextBtns">
                    <button onClick={()=>{ GeralChatAmigoDadosPerfil(dados.id)}}>
                        Perfil
                    </button>
                    <button onClick={() => solicitarAmizade(socket, dadosUsuario, dados.id)}>
                        Adicionar
                    </button>
                </div>
            </div>
            {/* <div className="GeralChatAmigobtn">
           
                
            </div> */}
            <div className={classe}>
                <li>pedido enviado</li>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-patch-check-fill" viewBox="0 0 16 16">
                  <path d="M10.067.87a2.89 2.89 0 0 0-4.134 0l-.622.638-.89-.011a2.89 2.89 0 0 0-2.924 2.924l.01.89-.636.622a2.89 2.89 0 0 0 0 4.134l.637.622-.011.89a2.89 2.89 0 0 0 2.924 2.924l.89-.01.622.636a2.89 2.89 0 0 0 4.134 0l.622-.637.89.011a2.89 2.89 0 0 0 2.924-2.924l-.01-.89.636-.622a2.89 2.89 0 0 0 0-4.134l-.637-.622.011-.89a2.89 2.89 0 0 0-2.924-2.924l-.89.01zm.287 5.984-3 3a.5.5 0 0 1-.708 0l-1.5-1.5a.5.5 0 1 1 .708-.708L7 8.793l2.646-2.647a.5.5 0 0 1 .708.708"/>
                </svg>
            </div>
        </div>
    );
}