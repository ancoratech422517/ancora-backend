import { useState } from "react";
import "../css/GeralChat.css"
import GeralChatMenu from "./geralChatMenu";
import GeralChatUsuario from "./geralChatUsuario";
export default function GeralChat ({setViewChat}){
    return (
        <div className="GeralChat">
            <GeralChatMenu  setViewChat={setViewChat}/>
            <GeralChatUsuario />
        </div>
    )
}