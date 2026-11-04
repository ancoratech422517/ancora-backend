import { useEffect, useState } from "react";
import "./css/Conteiner7ScrollDados1.css";
import { useUserStore } from "../../useUseSotore";
import { Aceitar_pedido_amizade } from "../../service/socket_service_aceitar_amizade";
import { Recusar_pedido_amizade } from "../../service/socker_service_recusar_pedido";
import Perfil from "../../assets/img_fundo_vazio/perfil.png"
export default function Conteiner7ScrollDados1({ dados }) {
    // 1. Puxamos as funções globais da Store
    const { socket, dadosUsuario, buscarAmigosNoBanco, buscar_notificacao , urlBancoDeDados } = useUserStore();
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
    const URLIMAGE = `${getUrlVideo(dados.foto_usuario)}`
    const [estadofotoPerfil , setEstadoFotoPerfil] = useState(valor)
    const condicaoEstadoPerfil = ()=>{
        switch(estadofotoPerfil){
            case "none":

                return (
                    <div className="Conteiner7ScrollDados1IconeBox tirarBorda">
                        <img src={Perfil} alt="" />
                    </div>
                )
                
            case "ativo":
             
                const URLIMAGE = `${getUrlVideo(dados.foto_usuario)}`
                return (
                    <div className="Conteiner7ScrollDados1IconeBox">
                        <img src={URLIMAGE} alt="" />
                    </div>
                )
        }
    }
    useEffect(() => {
        if (!socket) return;

        const handleAceitar = (data) => {
            console.log("✅ Pedido aceito via Socket:", data);
            
            if (dadosUsuario?.id) {
                // 2. Agora usamos as funções que vêm diretamente da Store
                buscarAmigosNoBanco(dadosUsuario.id);
                buscar_notificacao(dadosUsuario.id);
               
            }

            alert(data.mensagem || data.menssagem || "Pedido aceito com sucesso!");
        };

        socket.on("response_aceitar_pedido_amizade", handleAceitar);

        return () => socket.off("response_aceitar_pedido_amizade", handleAceitar);
        
        // Adicionamos as funções da store nas dependências para o React ficar atento
    }, [socket, dadosUsuario?.id, buscarAmigosNoBanco, buscar_notificacao]);

    
    // Lógica visual (Gradiente)
    const gerarGradienteElegante = (id) => {
        const coresBase = [
            ["#6a11cb", "#2575fc"], ["#ff9a9e", "#fecfef"],
            ["#00b09b", "#96c93d"], ["#00ffea", "#60d449"]
        ];
        const parDeCores = coresBase[id % coresBase.length] || coresBase[0];
        return `linear-gradient(135deg, ${parDeCores[0]}, ${parDeCores[1]})`;
    };

    const meuGradiente = gerarGradienteElegante(dados.de_id);

    return (
        <div className="Conteiner7ScrollDados1">
            <div className="Conteiner7ScrollDados1Box1">
                <div className="Conteiner7ScrollDados1Box1Icone">
                    {condicaoEstadoPerfil()}
                </div>
                <div className="Conteiner7ScrollDados1Box1Cont">
                    <li><b> {dados.nome_remetente} </b> enviou um pedido de amizade</li>
                </div>
            </div>
            <div className="Conteiner7ScrollDados1Box3">
                <div className="btnsConts">
                    <button onClick={()=> Aceitar_pedido_amizade(socket , dados.de_id , dadosUsuario , dados.foto_usuario)}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-stack" viewBox="0 0 16 16">
                            <path d="m14.12 10.163 1.715.858c.22.11.22.424 0 .534L8.267 15.34a.6.6 0 0 1-.534 0L.165 11.555a.299.299 0 0 1 0-.534l1.716-.858 5.317 2.659c.505.252 1.1.252 1.604 0l5.317-2.66zM7.733.063a.6.6 0 0 1 .534 0l7.568 3.784a.3.3 0 0 1 0 .535L8.267 8.165a.6.6 0 0 1-.534 0L.165 4.382a.299.299 0 0 1 0-.535z"/>
                            <path d="m14.12 6.576 1.715.858c.22.11.22.424 0 .534l-7.568 3.784a.6.6 0 0 1-.534 0L.165 7.968a.299.299 0 0 1 0-.534l1.716-.858 5.317 2.659c.505.252 1.1.252 1.604 0z"/>
                        </svg>
                        Aceitar
                    </button>
                    <button onClick={()=> Recusar_pedido_amizade(socket , dados.de_id , dadosUsuario)}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-trash-fill" viewBox="0 0 16 16">
                            <path d="M2.5 1a1 1 0 0 0-1 1v1a1 1 0 0 0 1 1H3v9a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V4h.5a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1H10a1 1 0 0 0-1-1H7a1 1 0 0 0-1 1zm3 4a.5.5 0 0 1 .5.5v7a.5.5 0 0 1-1 0v-7a.5.5 0 0 1 .5-.5M8 5a.5.5 0 0 1 .5.5v7a.5.5 0 0 1-1 0v-7A.5.5 0 0 1 8 5m3 .5v7a.5.5 0 0 1-1 0v-7a.5.5 0 0 1 1 0"/>
                        </svg>
                        Recusar
                    </button>
                </div>
            </div>
        </div>
    );
}