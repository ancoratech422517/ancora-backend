import { useUserStore } from "../../../useUseSotore"
import { fetchJsonComAuth } from "../../../utils/api"

export async function ConteinerDepositarDinheiroNaConta(setEstadoMenssageBaner, setEstadoConteinerDeposito, setEstadoCarteiraDeposito, setMensagemErroDeposito) {
    const store = useUserStore.getState()
    const numero_conta = document.getElementById("numero_conta")?.value
    const valorConta = document.getElementById("valorConta")?.value

    setEstadoMenssageBaner("False")
    try {
        const { response, data } = await fetchJsonComAuth(`${store.urlBancoDeDados}/depositar_pinheiro`, {
            method: "post",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ numero_conta, valor_sacar_conta: valorConta }),
            offlineQueue: false,
        })
        if (!response.ok) {
            setMensagemErroDeposito(data.message || data.error || "Deposito nao confirmado.")
            setEstadoMenssageBaner("Error")
            return
        }

        setEstadoMenssageBaner("True")
        setTimeout(() => {
            setEstadoConteinerDeposito("False")
            setEstadoCarteiraDeposito("cont1")
            setEstadoMenssageBaner("none")
            store.buscar_notificacao(store.dadosUsuario?.id)
            store.tocarSomRecebido()
        }, 3000)
    } catch {
        setMensagemErroDeposito("Servico indisponivel. Tenta novamente mais tarde.")
        setEstadoMenssageBaner("Error")
    }
}