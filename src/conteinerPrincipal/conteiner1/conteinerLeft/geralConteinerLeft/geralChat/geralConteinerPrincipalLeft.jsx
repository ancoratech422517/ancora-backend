import { useState } from "react";
import "../css/GeralConteinerPrincipalLeft.css"
import GeralChat from "./geralChat";
import GeralChatAmigo from "./geralChatAmigo";
import Conteiner7 from "../../../../conteiner7/conteiner7";
export default function GeralConteinerPrincialLeft (){
    const [viwChat , setViewChat] = useState("chat")
    const ViewAba = () =>{
        switch(viwChat){
            case "chat":
                return <GeralChat setViewChat={setViewChat}/>
            case "amigo_chat":
                return <GeralChatAmigo setViewChat={setViewChat} />
            case "conteiner7":
                return <Conteiner7 setViewChat={setViewChat} />
            default:
                return <GeralChat setViewChat={setViewChat} />

        }
    }
    return (
        <div className="GeralConteinerPrincipalLeft">
            {ViewAba()}
        </div>
    )
}