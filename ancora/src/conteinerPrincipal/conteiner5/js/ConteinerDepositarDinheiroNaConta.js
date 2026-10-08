import { useUserStore } from "../../../useUseSotore"
export async function ConteinerDepositarDinheiroNaConta(setEstadoMenssageBaner , setEstadoConteinerDeposito , setEstadoCarteiraDeposito) {
    const URLBACKEND_ANCORA = useUserStore.getState().urlBancoDeDados
    const getNotificacaoes = useUserStore.getState().buscar_notificacao
    const tocarSom = useUserStore.getState().tocarSomRecebido
    const DadosUsuario = useUserStore.getState().dadosUsuario
    const numero_conta = document.getElementById("numero_conta").value
    const valorConta = document.getElementById("valorConta").value

    const Dados = {
        "numero_conta":numero_conta,
        "valor_sacar_conta":valorConta,
        "id_usuario":DadosUsuario.id

    }
    const depositar = await fetch(`${URLBACKEND_ANCORA}/depositar_pinheiro`,{
        method:"post",
        headers:{
            "Content-Type":"application/json"
        },
        body:JSON.stringify(Dados)
    })
    const resposta = await depositar.json()

    setEstadoMenssageBaner("False")
    if (depositar.ok){
        setTimeout(() => {
            setEstadoMenssageBaner("True")
        }, 2000);
        setTimeout(() => {
            setEstadoConteinerDeposito("False")
            setEstadoCarteiraDeposito("cont1")
            setEstadoMenssageBaner("none")
            getNotificacaoes(DadosUsuario.id)
            tocarSom()
        }, 5000);
    }
    
}