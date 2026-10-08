
import { useUserStore } from "../../../../useUseSotore"
export async function MenuMobileSelecionarOpcao (e){
    let selecao = document.querySelectorAll(".ConteinerRightMenuMobileTurmaBox2DivMenuText")
    const id_turma = useUserStore.getState().DadosTurma
    const URLBACKEND = useUserStore.getState().urlBancoDeDados
    selecao.forEach((dados)=>{
        dados.classList.remove("borda_menu")
    })
    e.currentTarget.classList.add("borda_menu")

}