import { useEffect, useState } from "react";
import "./css/Conteiner7ScrollDados1.css";
import { useUserStore } from "../../useUseSotore";
import { Aceitar_pedido_amizade } from "../../service/socket_service_aceitar_amizade";
import { Recusar_pedido_amizade } from "../../service/socker_service_recusar_pedido";
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
                    <b>{dados.nome_remetente ? dados.nome_remetente[0] : "!"}</b>
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
                <div className="Conteiner7ScrollDados1Box1Icone" style={{background: meuGradiente}}>
                    {condicaoEstadoPerfil()}
                </div>
                <div className="Conteiner7ScrollDados1Box1Cont">
                    <li><b> {dados.nome_remetente} </b> enviou um pedido de amizade</li>
                </div>
            </div>
            <div className="Conteiner7ScrollDados1Box3">
                <div className="btnsConts">
                    <button onClick={()=> Aceitar_pedido_amizade(socket , dados.de_id , dadosUsuario , dados.foto_usuario)}>Aceitar</button>
                    <button onClick={()=> Recusar_pedido_amizade(socket , dados.de_id , dadosUsuario)}>Recusar</button>
                </div>
            </div>
        </div>
    );
}