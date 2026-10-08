import { useState } from "react";
import "../css/GeralChatMenu.css"
import GeralChatMenuBoxTop from "./geralChatMenuBoxTop";
import GeralChatMenuButtom from "./geralChatMenuBoxButtom";
export default function GeralChatMenu ({setViewChat}){
    return (
        <div className="GeralChatMenu">
             <GeralChatMenuBoxTop setViewChat={setViewChat} />
             <GeralChatMenuButtom />
        </div>
    )
}