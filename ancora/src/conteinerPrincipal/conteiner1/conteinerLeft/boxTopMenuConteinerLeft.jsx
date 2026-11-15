import "./css/boxTopMenuConteinerLeft.css"
import Button2 from "../../components/conteinerComponentesJsx/btn2";
import Button3 from "../../components/conteinerComponentesJsx/btn3";
import Button5 from "../../components/conteinerComponentesJsx/btn5"
import Button7 from "../../components/conteinerComponentesJsx/btn7";
import Button9 from "../../components/conteinerComponentesJsx/btn9";
import { useUserStore } from "../../../useUseSotore";
import { ASSISTANT_CHAT_TYPE, createAssistantChat } from "../../assistente/assistantConfig";
import { EsconderMenuMobileRight } from "../conteinerRight/js/menuMobile";
export default function BoxTopMenuConteinerLeft({ativarConteiner , setDadosUsuario}){
    const { dadosUsuario, ChatAtivo, openAssistantChat, setMostrarChat } = useUserStore();
    const assistantSelected = ChatAtivo?.tipo_chat === ASSISTANT_CHAT_TYPE;
    const openAssistant = () => {
      if (!assistantSelected) {
        openAssistantChat(createAssistantChat(dadosUsuario?.id));
      }
      EsconderMenuMobileRight(setMostrarChat);
      setMostrarChat(true);
      ativarConteiner("conteiner1");
    };

    return (
        <div className="boxTopMenuConteinerLeft">
           <div className="boxTopMenuConteinerLeftBTN">
             <Button2 ativarConteiner={ativarConteiner}/>
             {/* <li>Chat</li> */}

           </div>
           <div className="boxTopMenuConteinerLeftBTN">
             <Button3 ativarConteiner={ativarConteiner}/>
             {/* <li>Loja</li> */}
           </div>
           <div className="boxTopMenuConteinerLeftBTN">
             <Button7 ativarConteiner={ativarConteiner}/>
             {/* <li>Painel</li> */}
           </div>
           <div className="boxTopMenuConteinerLeftBTN">
             <Button9 ativarConteiner={ativarConteiner}/>
           </div>
           <div className="boxTopMenuConteinerLeftBTN">
             <button
               className="assistantNavButton"
               type="button"
               aria-pressed={assistantSelected}
               aria-label="Abrir assistente de IA"
               title="Assistente de IA"
               onClick={openAssistant}
             >
               <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                 <path d="M7.5 18.5H6a3 3 0 0 1-3-3v-8a3 3 0 0 1 3-3h12a3 3 0 0 1 3 3v8a3 3 0 0 1-3 3h-5l-4.5 3v-3Z" />
                 <path d="m12 7 .8 2.2L15 10l-2.2.8L12 13l-.8-2.2L9 10l2.2-.8L12 7Z" />
                 <path d="m17 12 .5 1.5L19 14l-1.5.5L17 16l-.5-1.5L15 14l1.5-.5L17 12Z" />
               </svg>
             </button>
           </div>
           <div className="boxTopMenuConteinerLeftBTN">
             <Button5 ativarConteiner={ativarConteiner} setDadosUsuario={setDadosUsuario} />
             {/* <li>Perfil</li> */}
           </div>
        </div>
    )
}

// agora analiza bem a minha UI no que toca as paletas de cor na hora de alternar de modo escuro , nem todas os elementos na minha UI teem variaveis de ambiante , algumas eu mete mesmo assim a puro , entao tens que ver la issoo e trocar , tambem a imagem de fundo do chat de conversa tem que trocar ou veja uma imagem de fundo preto que condiz com o tema escuro na inaternet ou mete apenas uma paleta de cor em vez de imagem

