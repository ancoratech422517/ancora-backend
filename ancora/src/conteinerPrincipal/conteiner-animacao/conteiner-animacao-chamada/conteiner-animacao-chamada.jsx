import useState from 'react'
import './conteiner-animacao-chamada.css'
import { useUserStore } from '../../../useUseSotore'
export default function Conteiner_Animacao_Chamada_Grupo(){
    const {setEstadoChamadaGrupo} = useUserStore()
    const pararSomChamada = useUserStore(
        (state) => state.pararSomChamada
        )
    return(
        <div className='conteiner-animacao-chamada'>
            <div className="conteiner-animacao-chamada_painel">
                <div className="conteiner-animacao-chamada_painel_Perfil_Grupo"></div>
                <h1>Curso de Python</h1>
                <p> a sua turma esta ao vivo , e esta chamando por você...</p>
                <div className="btnOpcao">
                    <button>Entrar</button>
                    <button onClick={()=>{pararSomChamada() , setEstadoChamadaGrupo(false)}}>Rejeitar</button>
                </div>
            </div>
        </div>
    )
}
