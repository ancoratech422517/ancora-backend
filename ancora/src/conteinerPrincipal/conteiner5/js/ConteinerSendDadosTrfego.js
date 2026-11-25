import { useUserStore } from "../../../useUseSotore";
import { fetchJsonComAuth } from "../../../utils/api";

export async function ConteinerSendDadosTrafego(setEstadoRespostaTrafego, setRespostaTrafego, setEstadoTrafegoConteiner, setEstadoTrafegoAtivo, setEstado) {
    const store = useUserStore.getState()
    const URLBACKEND_ANCORA = store.urlBancoDeDados
    setEstadoRespostaTrafego("Loading")

    try {
        const { response, data } = await fetchJsonComAuth(`${URLBACKEND_ANCORA}/send_dados_trafego`, {
            method: "post",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(store.dadosTrafego),
            offlineQueue: false,
        })
        if (!response.ok) {
            setRespostaTrafego(data.message || data.error || "Pagamento nao confirmado.")
            setEstadoRespostaTrafego("Error")
            return
        }

        setRespostaTrafego(data.status || "Pedido recebido.")
        setEstadoRespostaTrafego("True")
        setTimeout(() => {
            setEstadoRespostaTrafego("False")
            setEstadoTrafegoConteiner("cont1")
            setEstadoTrafegoAtivo("False")
            setEstado("buscar")
            useUserStore.getState().tocarSomRecebido()
        }, 6000)
    } catch {
        setRespostaTrafego("Servico indisponivel. Tenta novamente mais tarde.")
        setEstadoRespostaTrafego("Error")
    }
}