import { useUserStore } from "../../../../../useUseSotore"; 
import "../css/GeralChatMenuBoxTop.css";
import Button8 from "../../../../components/conteinerComponentesJsx/btn8";
import Mais from "../../../../components/conteinerSvg/mais";
import { Limpar_notificacao } from "../js/geralChatMenuBox";
import { useState } from "react";
import Logo from "../../../../../assets/logo2.png"
export default function GeralChatMenuBoxTop ({ setViewChat }) {
    
    // 1. Conectamos à Store Global (Zustand)
    // Agora o componente "escuta" qualquer mudança que ocorra em 'notificacoes'
    const notificacoes = useUserStore((state) => state.notificacoes);
    const dados = useUserStore((state) => state.dadosUsuario)
    const {urlBancoDeDados} = useUserStore()
    // 2. A LÓGICA DE ENGENHARIA:
    // Usamos o ?. (Optional Chaining) para evitar erros caso a lista esteja nula.
    // Pegamos o totalNoti do primeiro item da lista (nossa redundância do Python).
    const totalNoti = (notificacoes?.length > 0) ? notificacoes[0].total_notificacao : 0;
    
    const handleAcaoNotificacao = () => {

        // Segundo: Se houver algo para zerar, disparamos o POST
        if (totalNoti > 0 && dadosUsuario?.id) {
            fetch(`${urlBancoDeDados}/notificacoes/marcar_lidas/${dados.id}`, {
                method: 'POST'
            })
            .then(() => {
                // Atualizamos a Store local para o balão sumir na hora
                // Criamos uma nova lista mantendo os dados, mas zerando o contador
                const listaZerada = notificacoes.map(n => ({ ...n, total_notificacao: 0 }));
                setNotificacoes(listaZerada);
            })
            .catch(err => console.error("Erro ao zerar balão:", err));
        }
    };

    return (
        <div className="GeralChatMenuBoxTop">
            <div className="GeralChatMenuTopText">
                <div className="GeralChatMenuTopTextLogo">
                    <img src={Logo} alt="" />
                </div>
                <h3>
                    <li><b className="ancora">An</b>cora</li>
                </h3>
            </div>
            <div className="GeralChatMenuTopIcone">
                
                <div className="GeralChatMrnuTopIconeBtnNoti" onClick={()=>{ Limpar_notificacao(dados.id) ; notificacoes[0].total_notificacao = 0}}>
                    <Button8 setViewChat={setViewChat} />
                    
                    {/* 3. RENDERIZAÇÃO CONDICIONAL: 
                        O span com o número 4 (ou qualquer valor real) 
                        só aparece se totalNoti for maior que zero */}
                    {totalNoti > 0 && (
                        <span className="ativo" id="mais_ativo">
                            {totalNoti}
                        </span>
                    )}
                </div>

                <b onClick={() => setViewChat("amigo_chat")}>
                    <Mais />
                </b>
            </div>
        </div>
    );
}