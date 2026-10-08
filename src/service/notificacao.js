import { useEffect } from 'react';
import React from 'react';
import { useState } from 'react';

export function useSocketEvents(socket) {

    
    useEffect(() => {
        // Lógica de segurança: Se o socket não existir ou não for funcional, paramos aqui.
        // Isso evita que o React tente ler propriedades de 'null' e trave a tela (Tela Branca).
        if (!socket || typeof socket.on !== 'function') {
            return; 
        }

        // Ouvindo o evento de notificação
        socket.on('receber_notificacao', (data) => {
            console.log("🔔 Nova notificação:", data);

        });

        // IMPORTANTE: Limpar o evento quando o componente desmontar
        return () => {
            socket.off('receber_notificacao');
            console.log("Removendo escutador de notificações");
        };
        
    }, [socket]);
}