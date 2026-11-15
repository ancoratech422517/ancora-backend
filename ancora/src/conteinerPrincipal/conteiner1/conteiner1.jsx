import "./conteiner1.css"
import ConteinerLeft from "./conteinerLeft/conteinerLeft"
import ConteinerRight from "./conteinerRight/conteinerRight";
import ConteinerRightMenuMobile from "./conteinerRightMenuMobile/conteinerRightMenuMobile";
import { useUserStore } from "../../useUseSotore";
import { ASSISTANT_CHAT_TYPE } from "../assistente/assistantConfig";
export default function Continer1({ativarConteiner}){
    const ChatAtivo = useUserStore((state) => state.ChatAtivo);
    const MostrarChat = useUserStore((state) => state.MostrarChat);
    const assistantOpen = ChatAtivo?.tipo_chat === ASSISTANT_CHAT_TYPE;
    const containerClasses = [
        "conteiner1",
        MostrarChat && "chatOpen",
        assistantOpen && "assistantOpen",
    ].filter(Boolean).join(" ");

    return (
        <div className={containerClasses}>
             <ConteinerLeft />
             <ConteinerRight ativarConteiner = {ativarConteiner} />
             <ConteinerRightMenuMobile />
        </div>
    )
}