import './conteiner-animacao-chamada.css'
import { useUserStore } from '../../../useUseSotore'
export default function Conteiner_Animacao_Chamada_Grupo(){
    const {
        DadosChamadaGrupo,
        setEstadoChamadaGrupo,
        set_estado_conteiner_live,
        set_Dados_Live_Ancora,
        pararSomChamada
    } = useUserStore()

    const encerrarChamada = () => {
        pararSomChamada()
        setEstadoChamadaGrupo(false)
    }

    const entrarNaLive = () => {
        pararSomChamada()
        setEstadoChamadaGrupo(false)
        if (!DadosChamadaGrupo?.sala_Turma) return

        set_Dados_Live_Ancora({
            sala_Turma: DadosChamadaGrupo.sala_Turma,
            nome_Turma: DadosChamadaGrupo.nome_turma
        })
        set_estado_conteiner_live(true)
    }

    return(
        <div className='conteiner-animacao-chamada'>
            <div className="conteiner-animacao-chamada_painel">
                <div
                    className="conteiner-animacao-chamada_painel_Perfil_Grupo"
                    style={DadosChamadaGrupo?.imagem_perfil_Turma ? {
                        backgroundImage: `url(${DadosChamadaGrupo.imagem_perfil_Turma})`,
                        backgroundSize: "cover",
                        backgroundPosition: "center"
                    } : undefined}
                />
                <h1>{DadosChamadaGrupo?.nome_turma || "Sua turma"}</h1>
                <p>A sua turma está ao vivo e está chamando por você.</p>
                <div className="btnOpcao">
                    <button onClick={entrarNaLive}>Entrar</button>
                    <button onClick={encerrarChamada}>Rejeitar</button>
                </div>
            </div>
        </div>
    )
}
