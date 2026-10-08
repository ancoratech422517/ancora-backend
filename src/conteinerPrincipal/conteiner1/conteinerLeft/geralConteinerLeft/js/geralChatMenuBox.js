import { useUserStore } from "../../../../../useUseSotore"
export async function Limpar_notificacao (usuarioId) {
    const URL_BACKEND_ANCORA = useUserStore.getState().urlBancoDeDados
    const limpar_notificacao = await fetch(`${URL_BACKEND_ANCORA}/notificacoes/marcar_lidas/${usuarioId}`)
    const resultado = limpar_notificacao.json()
    
}