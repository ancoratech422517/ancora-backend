import { useUserStore } from "../../../useUseSotore";

export async function ConteinerSendDadosTrafego(setEstadoRespostaTrafego , setRespostaTrafego , setEstadoTrafegoConteiner , setEstadoTrafegoAtivo , setEstado){
    const DadosTrafego = useUserStore.getState().dadosTrafego
    
    const URLBACKEND_ANCORA = useUserStore.getState().urlBancoDeDados
    const dados_em_dicionario = DadosTrafego
    const SendDadosTrafego = await fetch(`${URLBACKEND_ANCORA}/send_dados_trafego` , {
        method:"post",
        headers:{
            "Content-Type":"application/json"
        },
        body:JSON.stringify(dados_em_dicionario)
    })
    const getResponse = await SendDadosTrafego.json()
    if (getResponse){
        setEstadoRespostaTrafego("Loading")
        setTimeout(() => {
            setEstadoRespostaTrafego("True")
            setRespostaTrafego(getResponse.status)
        }, 3000);
        setTimeout(() => {
            setEstadoRespostaTrafego("False")
            setEstadoTrafegoConteiner("cont1")
            setEstadoTrafegoAtivo("False")
            setEstado("buscar")
            useUserStore.getState().tocarSomRecebido()
            
        }, 6000);

    }

}