
import { useUserStore } from "../useUseSotore"
export async function fetchComAuth(url, options = {}) {
  const URL_BACKEND_ANCORA = useUserStore.getState().urlBancoDeDados
  const fullUrl = url.startsWith('http')
    ? url
    : `${URL_BACKEND_ANCORA}` + url

  const config = {
    ...options,
    credentials: 'include', // obrigatório
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    }
  }

  let res = await fetch(fullUrl, config)

  if (res.status === 401) {
    console.log('🔄 Token expirado, tentando renovar...')

    const refreshRes = await fetch(
      `${URL_BACKEND_ANCORA}/refresh`,
      {
        method: 'POST',
        credentials: 'include'
      }
    )

    if (refreshRes.ok) {
      console.log('✅ Token renovado')
      res = await fetch(fullUrl, config)
    } else {
      throw new Error('Sessão expirada')
    }
  }

  return res
}
