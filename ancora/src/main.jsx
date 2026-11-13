import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { fetchComAuth, startOfflineRequestSync } from './utils/api'
import { startChatOutboxSync } from './service/chatOfflineSync'
import { AuthProvider } from './contextApi.jsx'
createRoot(document.getElementById('root')).render(
  <AuthProvider>
    <App />
  </AuthProvider>,
)
startOfflineRequestSync(fetchComAuth)
startChatOutboxSync()

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/service-worker.js").catch((error) => {
      console.error("Não foi possível ativar o cache offline da Âncora:", error)
    })
  })
}

export const useAuth = () => useContext(AuthContext);