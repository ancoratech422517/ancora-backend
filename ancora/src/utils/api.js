
import { useUserStore } from "../useUseSotore"
import {
  enqueueRequest,
  isQueueableMutation,
  OfflineQueuedError,
  startOfflineRequestSync,
} from "./offlineOutbox"
export async function fetchComAuth(url, options = {}) {
  const URL_BACKEND_ANCORA = useUserStore.getState().urlBancoDeDados
  const fullUrl = url.startsWith('http')
    ? url
    : `${URL_BACKEND_ANCORA}` + url

  const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData
  const { offlineQueue = true, ...requestOptions } = options
  const method = (requestOptions.method || "GET").toUpperCase()
  const queueable = offlineQueue && isQueueableMutation(fullUrl, method)
  const config = {
    ...requestOptions,
    credentials: 'include', // obrigatório
    headers: {
      ...(!isFormData && requestOptions.body != null ? { 'Content-Type': 'application/json' } : {}),
      ...requestOptions.headers,
    }
  }

  let res
  if (queueable && !navigator.onLine) {
    const queueId = await enqueueRequest({
      url: fullUrl,
      method,
      headers: config.headers,
      body: requestOptions.body,
    })
    throw new OfflineQueuedError(queueId)
  }

  try {
    res = await fetch(fullUrl, config)
  } catch (error) {
    if (queueable && !navigator.onLine) {
      const queueId = await enqueueRequest({
        url: fullUrl,
        method,
        headers: config.headers,
        body: requestOptions.body,
      })
      throw new OfflineQueuedError(queueId)
    }
    throw error
  }

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

export { startOfflineRequestSync }
