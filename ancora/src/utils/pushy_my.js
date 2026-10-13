import { Capacitor } from '@capacitor/core';
import PushyWeb from 'pushy-sdk-web';
import { useUserStore } from '../useUseSotore.js';

const PUSHY_APP_ID = '6ace3eb4d819808c52e4fdeb';

export function solicitarTokenPushy() {
  if (!Capacitor.isNativePlatform()) {
    return PushyWeb.register({ appId: PUSHY_APP_ID });
  }

  const pushyNative = globalThis['Pushy'];
  if (!pushyNative || typeof pushyNative.register !== 'function') {
    return Promise.reject(new Error('O SDK nativo do Pushy não está disponível.'));
  }

  pushyNative.listen();
  return new Promise((resolve, reject) => {
    pushyNative.register((erro, pushToken) => {
      if (erro) {
        reject(erro);
      } else if (typeof pushToken !== 'string' || !pushToken) {
        reject(new Error('O Pushy não retornou um token válido.'));
      } else {
        resolve(pushToken);
      }
    });
  });
}

export async function salvarTokenPushy(pushToken) {
  const urlBackend = useUserStore.getState().urlBancoDeDados;
  const resposta = await fetch(`${urlBackend}/api/salvar_push_token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ push_token: pushToken })
  });

  if (!resposta.ok) {
    const detalhe = await resposta.text();
    throw new Error(`Falha ao salvar token Pushy (${resposta.status}): ${detalhe}`);
  }

  return resposta.json();
}