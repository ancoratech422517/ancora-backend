import { useUserStore } from "../../../../useUseSotore";

export async function MenuMobileAgendarLive(sala_Turma , nome_Turma , setEstadoMenssageLive , setMostrarConteinerAgenda , id_admin_turma , set_Dados_Agenda_Turma , setestadoLoadingAgendamentoLive) {
    setestadoLoadingAgendamentoLive(true)
    const URLBACKEND = useUserStore.getState().urlBancoDeDados
    const id_usuario = useUserStore.getState().dadosUsuario
    const conectarSocket = useUserStore.getState().conectarSocket
    const my_socket = useUserStore.getState().socket
    const data_hora_agenda_live = document.getElementById("data_hora_agenda_live").value
    const tema_agenda_live = document.getElementById("tema_agenda_live").value

    const agora = new Date();
    const dataMinima = new Date(agora.getTime() - agora.getTimezoneOffset() * 60000).toISOString().slice(0, 16);

    if (tema_agenda_live.trim() === ""){
        alert("não podes registrar uma agenda sem um tema")
        return;
    }
    if (data_hora_agenda_live.trim() === "") {
        alert("Por favor, selecione uma data e hora para a live.");
        return;
    }

    if (data_hora_agenda_live < dataMinima) {
        alert("A data da live não pode ser no passado. Por favor, escolha uma data futura.");
        return;
    }
    const data_hora_formatada = data_hora_agenda_live.replace('T', ' ');
    const dataSelecionada = new Date(data_hora_formatada);
    const anoSelecionado = dataSelecionada.getFullYear();
    const anoAtual = new Date().getFullYear();
    
    // Bloqueia se o ano for maior que o ano atual + 5 anos (ajuste conforme sua necessidade)
    if (anoSelecionado > (anoAtual)) {
        alert("Data inválida! Por favor, escolha uma data dentro deste ano");
        return;
    }

    const dados = {
        "sala_Turma":sala_Turma,
        "nome_Turma":nome_Turma,
        "data_hora_agenda_live":data_hora_agenda_live,
        "tema_agenda_live":tema_agenda_live,
        "id_usuario":id_usuario.id
    }

    const agendar_live = await fetch(`${URLBACKEND}/agendar_live_turma` , {
        method:"POST",
        headers:{
            "Content-Type":"application/json"
        },
        body:JSON.stringify(dados)
    })
    const resposta = await agendar_live.json()

    setTimeout(() => {
        setestadoLoadingAgendamentoLive(false)
        setEstadoMenssageLive(true)
    }, 1000);
    setTimeout(() => {
        setEstadoMenssageLive(false)
        setMostrarConteinerAgenda(false)
    }, 4000);
    fetch(`${URLBACKEND}/buscar_agenda_turma/${nome_Turma}/${id_admin_turma}`)
    .then(res=>res.json())
    .then(dados=>{
        set_Dados_Agenda_Turma(dados)
    })
    //avisando e buscando a agenda para todos os usuarios
    let dadosAgendaTurma = {
        "nome_turma":nome_Turma,
        "id_admin_turma":id_admin_turma
    }
    my_socket.emit("buscar_agenda_turma" , dadosAgendaTurma)


}

