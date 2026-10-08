import { useEffect } from "react"; 
import { useUserStore } from "../../useUseSotore"; 
import "./css/Conteiner7Scroll.css";

// Importa todos os containers de notificação
import Conteiner7ScrollDados1 from "./Conteiner7ScrollDados1"; // pedido_amizade
import ConteinerScrollDados2 from "./Conteiner7Scrolldados2";  // curtida
import Conteiner7ScrollDados3 from "./Conteiner7ScrollDados3";
import Conteiner7ScrollDados4 from "./Conteiner7ScrollDados4";
export default function Conteiner7Scroll() {
    const { socket, notificacoes, setNotificacoes , dadosUsuario } = useUserStore();
        // 1. Mapeia cada tipo para seu componente

    const COMPONENTES_NOTIFICACAO = {
        pedido_amizade: Conteiner7ScrollDados1,
        compra_produto_cliente: ConteinerScrollDados2,
        compra_produto_vendedor:Conteiner7ScrollDados3,
        ancora_ecommerce:Conteiner7ScrollDados4
        // adiciona novos tipos aqui sem mexer no JSX
    };
    
    useEffect(() => {
        if (socket) {
            const handleSocket = (nova_notificacao) => {
                console.log("Nova via Socket chegando:", nova_notificacao);
                setNotificacoes(prev => [nova_notificacao, ...prev]);
            };

            socket.on('receber_notificacao', handleSocket);
            return () => socket.off('receber_notificacao', handleSocket);
        }
    }, [socket, setNotificacoes]);

    return (
        <div className="Conteiner7Scroll">
            {notificacoes && notificacoes.length > 0 ? (
                notificacoes.map((item, index) => {
                    // 2. Pega o componente certo baseado no tipo
                    const Componente = COMPONENTES_NOTIFICACAO[item.tipo_notificacao];
                    
                    // 3. Se não tiver mapeado, não renderiza nada ou usa um fallback
                    if (!Componente) {
                        console.warn(`Tipo não mapeado: ${item.tipo_notificacao}`);
                        return null;
                    }

                    return (
                        <Componente 
                            key={item.id || item.id_pedido || index} 
                            dados={item} 
                        />
                    );
                })
            ) : (
                <p className="vazio">Nenhuma notificação.</p>
            )}
            {/* <Conteiner7ScrollDados4 /> */}
            
            
        </div>
    );
}