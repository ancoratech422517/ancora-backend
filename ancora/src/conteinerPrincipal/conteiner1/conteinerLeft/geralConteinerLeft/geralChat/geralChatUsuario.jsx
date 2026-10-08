import { useState } from "react";
import { useUserStore } from "../../../../../useUseSotore";
import "../css/GeralChatUsuario.css";
import GeralChatDados from "./geralChatDados";
import fundoVazioChat from "../../../../../assets/fundo_vazio_chat2.jpg";

export default function GeralChatUsuario() {
  // Pega a lista de amigos da Store
  const amigos = useUserStore((state) => state.amigos);


  return (
    <div className="GeralChatUsuario" id="GeralChatUsuario">
      {/* Se houver amigos, faz o mapeamento. Se não, mostra um aviso */}
      {amigos && amigos.length > 0 ? (
        amigos.map((amigo) => (
          <GeralChatDados 
            key={amigo.id_amigo} 
            dados={amigo} 
            quantidade_menssagem_lida = {amigo.quantidade_menssagem_nao_lida}
            ultima_menssagem = {amigo.ultima_menssagem}
            nossa_sala = {amigo.nossa_sala}
          />
        ))

      ) : (
        <p className = "fundo_vazio_chat">
          <img src={fundoVazioChat} alt="Fundo vazio do chat" />
        </p>
      )}
      
    </div>
  );
}