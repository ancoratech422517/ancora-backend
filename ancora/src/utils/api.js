
import { useUserStore } from "../useUseSotore"
import {
  enqueueRequest,
  isQueueableMutation,
  OfflineQueuedError,
  startOfflineRequestSync,
} from "./offlineOutbox"
import { beginApiRequest } from "./apiRequestTracker"

let accessToken = null
let accessTokenExpiresAt = 0
let refreshPromise = null
let authGeneration = 0
let rawFetch = null

function backendBaseUrl() {
  return useUserStore.getState().urlBancoDeDados.replace(/\/+$/, "")
}

function storeAccessToken(token, expiresIn) {
  accessToken = token
  accessTokenExpiresAt = Date.now() + Math.max(0, expiresIn - 30) * 1000
}

export function setAccessToken(token, expiresIn = 900) {
  if (typeof token !== "string" || !token) {
    throw new TypeError("O token de acesso recebido do servidor é inválido.")
  }
  if (!Number.isFinite(expiresIn) || expiresIn <= 0) {
    throw new TypeError("A validade do token de acesso é inválida.")
  }
  authGeneration += 1
  storeAccessToken(token, expiresIn)
}

export function clearAccessToken() {
  authGeneration += 1
  accessToken = null
  accessTokenExpiresAt = 0
}

export async function getAccessToken({ forceRefresh = false } = {}) {
  if (!forceRefresh && accessToken && accessTokenExpiresAt > Date.now()) {
    return accessToken
  }
  if (refreshPromise) {
    return refreshPromise
  }
  if (!rawFetch) {
    throw new Error("O cliente seguro da API ainda não foi inicializado.")
  }

  const generation = authGeneration
  refreshPromise = (async () => {
    const response = await rawFetch(`${backendBaseUrl()}/refresh`, {
      method: "POST",
      credentials: "include",
    })
    if (!response.ok) {
      return null
    }

    const data = await response.json()
    if (
      typeof data?.access_token !== "string" ||
      !Number.isFinite(data?.expires_in) ||
      data.expires_in <= 0
    ) {
      throw new Error("A resposta de renovação da sessão é inválida.")
    }
    if (generation !== authGeneration) {
      return null
    }
    storeAccessToken(data.access_token, data.expires_in)
    return accessToken
  })().finally(() => {
    refreshPromise = null
  })

  return refreshPromise
}

function isPublicBackendRequest(url) {
  const path = url.pathname.replace(/\/+$/, "") || "/"
  return (
    path.toLowerCase() === "/login" ||
    path === "/refresh" ||
    path === "/api/Registrar" ||
    path.startsWith("/api/crm/public/")
  )
}

export function installBearerTokenFetch() {
  if (typeof window === "undefined" || window.fetch.__ancoraBearerInstalled) {
    return
  }

  rawFetch = window.fetch.bind(window)
  const backendOrigin = new URL(backendBaseUrl(), window.location.origin).origin
  const authenticatedFetch = async (input, init = {}) => {
    const inputUrl = input instanceof Request ? input.url : String(input)
    const requestUrl = new URL(inputUrl, window.location.origin)
    const method = (init.method || (input instanceof Request ? input.method : "GET"))
      .toUpperCase()
    if (requestUrl.origin !== backendOrigin || method === "OPTIONS") {
      return rawFetch(input, init)
    }

    const finishApiRequest = beginApiRequest()
    try {
      if (isPublicBackendRequest(requestUrl)) {
        return await rawFetch(input, init)
      }

      const retryInput = input instanceof Request ? input.clone() : input
      const headers = new Headers(input instanceof Request ? input.headers : undefined)
      new Headers(init.headers).forEach((value, key) => headers.set(key, value))
      const token = await getAccessToken()
      if (token) {
        headers.set("Authorization", `Bearer ${token}`)
      } else {
        headers.delete("Authorization")
      }
      const response = await rawFetch(input, { ...init, headers })
      if (response.status !== 401) {
        return response
      }

      const refreshedToken = await getAccessToken({ forceRefresh: true })
      if (!refreshedToken) {
        return response
      }
      headers.set("Authorization", `Bearer ${refreshedToken}`)
      return await rawFetch(retryInput, { ...init, headers })
    } finally {
      finishApiRequest()
    }
  }
  Object.defineProperty(authenticatedFetch, "__ancoraBearerInstalled", {
    value: true,
  })
  window.fetch = authenticatedFetch
}

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
    return await fetch(fullUrl, config)
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
}

export { startOfflineRequestSync }
