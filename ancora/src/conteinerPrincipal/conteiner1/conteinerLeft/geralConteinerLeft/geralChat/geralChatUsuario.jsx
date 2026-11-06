import { useState } from "react";
import { useUserStore } from "../../../../../useUseSotore";
import "../css/GeralChatUsuario.css";
import GeralChatDados from "./geralChatDados";
import FundoVazioChat from "../../../../../assets/fundo_vazio_chat2.png";
import NaoLidasImg from "../../../../../assets/img_fundo_vazio/img_nao_lida.png"
import Img_privado from "../../../../../assets/img_fundo_vazio/img_privado.png"
import Img_Bloqueado from "../../../../../assets/img_fundo_vazio/img_bloqueado.png"
import { GeralChatUsuarioPrivadoConteinerPai } from "../js/GeralChatUsuarioPrivadoConteinerPai";
export default function GeralChatUsuario({setViewChat}) {
  // Pega a lista de amigos da Store
  const amigos = useUserStore((state) => state.amigos);
  const { DADOSTIPOCHAT, FUNDOVAZIOCHAT, setFUNDOVAZIOCHAT } = useUserStore();

  const condicao_tipo_chat_views = () => {
    switch(DADOSTIPOCHAT){
      case "normal":
        const estadoNormal = amigos ? amigos.filter(amigo => amigo.estado_privado_usuario === false & amigo.estado_bloqueado_usuario === false & amigo.estado_excluido_usuario === false) : []
        return(
          
          <div className="GeralChatUsuario" id="GeralChatUsuario">
            {estadoNormal && estadoNormal.length > 0 ? (
              estadoNormal.map((amigo) => (
                <GeralChatDados 
                  key={amigo.id_amigo} 
                  dados={amigo} 
                  quantidade_menssagem_lida={amigo.quantidade_menssagem_nao_lida}
                  ultima_menssagem={amigo.ultima_menssagem}
                  nossa_sala={amigo.nossa_sala}
                />
              )) 
            ) : ( 
              <p className="fundo_vazio_chat">
                <img src={FundoVazioChat} alt="Fundo vazio do chat" />
              </p>
            )}
          </div>
        );
        
      case "naoLido":
        // Filtra os amigos que possuem mensagens não lidas antes de mapear
        const amigosNaoLidos = amigos ? amigos.filter(amigo => amigo.quantidade_menssagem_nao_lida > 0) : [];

        return(
          <div className="GeralChatUsuario" id="GeralChatUsuario">
            {amigosNaoLidos.length > 0 ? (
              amigosNaoLidos.map((amigo) => (
                <GeralChatDados 
                  key={amigo.id_amigo} 
                  dados={amigo} 
                  quantidade_menssagem_lida={amigo.quantidade_menssagem_nao_lida}
                  ultima_menssagem={amigo.ultima_menssagem}
                  nossa_sala={amigo.nossa_sala}
                />
              )) 
            ) : ( 
              <p className="fundo_vazio_chat naoLidoImg">
                <img src={NaoLidasImg} alt="Nenhuma mensagem não lida" />
              </p>
            )}
          </div>
        );

      case "privado":
        const estadoPrivado = amigos ? amigos.filter(amigo => amigo.estado_privado_usuario === true) : []
        return(
          <div className="GeralChatUsuario" id="GeralChatUsuario">
            {estadoPrivado && estadoPrivado.length > 0 ? (
              estadoPrivado.map((amigo) => (
                <GeralChatDados 
                  key={amigo.id_amigo} 
                  dados={amigo} 
                  quantidade_menssagem_lida={amigo.quantidade_menssagem_nao_lida}
                  ultima_menssagem={amigo.ultima_menssagem}
                  nossa_sala={amigo.nossa_sala}
                />
              )) 
            ) : ( 
              <p className="fundo_vazio_chat naoLidoImg">
                <img src={Img_privado} alt="Chat privado vazio" />
              </p>
            )}
            <div className="GeralChatUsuarioPrivado">
              <div className="GeralChatUsuarioPrivadoConteinerPai">
                <h2>Login</h2>
                <p>A ancora necessita conferir que e voce mesmo que esta acessar as suas conversas privada</p>
                <label htmlFor="">Telefone</label>
                <input type="text" id="telefone-credencias"/>
                <label htmlFor="">Senha</label>
                <input type="password" id="senha-credencias" />
                <button onClick={GeralChatUsuarioPrivadoConteinerPai}>Entrar</button>
              </div>
              <div className="GeralChatUsuarioPrivadoFundoVazio">
                <img src={Img_privado} alt="" />
              </div>
            </div>
          </div>
        );
        
      case "bloqueado":
        const EstadoBloqueado = amigos ? amigos.filter(amigo => amigo.estado_bloqueado_usuario === true):[]
        return(
          <div className="GeralChatUsuario" id="GeralChatUsuario">
            {EstadoBloqueado && EstadoBloqueado.length > 0 ? (
              EstadoBloqueado.map((amigo) => (
                <GeralChatDados 
                  key={amigo.id_amigo} 
                  dados={amigo} 
                  quantidade_menssagem_lida={amigo.quantidade_menssagem_nao_lida}
                  ultima_menssagem={amigo.ultima_menssagem}
                  nossa_sala={amigo.nossa_sala}
                />
              )) 
            ) : ( 
              <p className="fundo_vazio_chat naoLidoImg">
                <img src={Img_Bloqueado} alt="Nenhum contato bloqueado" />
              </p>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    condicao_tipo_chat_views()
  );
}