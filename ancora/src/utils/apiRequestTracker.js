import { useSyncExternalStore } from "react"

const subscribers = new Set()
let pendingRequests = 0
let isVisible = false

function notifySubscribers() {
  subscribers.forEach((subscriber) => subscriber())
}

export function beginApiRequest() {
  pendingRequests += 1
  if (!isVisible) {
    isVisible = true
    notifySubscribers()
  }

  let finished = false
  return () => {
    if (finished) return
    finished = true
    pendingRequests = Math.max(0, pendingRequests - 1)

    if (pendingRequests === 0 && isVisible) {
      isVisible = false
      notifySubscribers()
    }
  }
}

export function subscribeToApiRequests(subscriber) {
  subscribers.add(subscriber)
  return () => subscribers.delete(subscriber)
}

export function getApiRequestLoading() {
  return isVisible
}

export function useApiRequestLoading() {
  return useSyncExternalStore(
    subscribeToApiRequests,
    getApiRequestLoading,
    () => false,
  )
}
