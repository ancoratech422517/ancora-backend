import { useState } from "react";
import { useUserStore } from "../../../../../useUseSotore";
import "../css/GeralChatUsuario.css";
import GeralChatDados from "./geralChatDados";

export default function GeralChatUsuario() {
  // Pega a lista de amigos da Store
  const amigos = useUserStore((state) => state.amigos);


  return (
    <div className="GeralChatUsuario">
      {/* Se houver amigos, faz o mapeamento. Se não, mostra um aviso */}
      {amigos && amigos.length > 0 ? (
        amigos.map((amigo) => (
          <GeralChatDados 
            key={amigo.id_amigo} 
            dados={amigo} 
            quantidade_menssagem_lida = {amigo.quantidade_menssagem_nao_lida}
          />
        ))

      ) : (
        <p style={{ color: "gray", textAlign: "center", padding: "20px" }}>
          Nenhum amigo encontrado.
        </p>
      )}
      
    </div>
  );
}