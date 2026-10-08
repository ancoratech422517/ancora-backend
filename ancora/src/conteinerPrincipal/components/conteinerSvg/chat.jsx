import { useState } from "react";

export default function ChatSvg(){
    return (
        <p>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            <span class="nav-badge" id="chat-badge"></span>
        </p>
    )
}