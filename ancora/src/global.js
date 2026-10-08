
export function AgendaMinima() {
    const agora = new Date()
    const DataMinima = new Date(agora.getTime() - agora.getTimezoneOffset() * 60000).toISOString().slice(0, 16)
    const agenda = document.getElementById("data_hora_agenda_live")

    if (agenda) {
        agenda.min = DataMinima
    }
}

export function AtualizarContadores() {
    const contadores = document.querySelectorAll('.contador')
    const agora = new Date().getTime()

    contadores.forEach((el) => {
        const dataLive = new Date(el.getAttribute('data-live-date')).getTime()
        const diferenca = dataLive - agora

        if (diferenca <= 0) {
            el.innerHTML = 'Live finalizada'
            el.classList.add('piscar-animacao')
        } else {
            const horas = Math.floor(diferenca / (1000 * 60 * 60))
            const minutos = Math.floor((diferenca % (1000 * 60 * 60)) / (1000 * 60))
            const segundos = Math.floor((diferenca % (1000 * 60)) / 1000)

            el.innerHTML = `⏳ Começa em: ${horas}h ${minutos}m ${segundos}s`
        }
    })
}

let contadorInterval = null

export function iniciarAtualizacaoContadores(intervalo = 1000) {
    if (contadorInterval) return
    contadorInterval = setInterval(AtualizarContadores, intervalo)
}

export function pararAtualizacaoContadores() {
    if (contadorInterval) {
        clearInterval(contadorInterval)
        contadorInterval = null
    }
}

