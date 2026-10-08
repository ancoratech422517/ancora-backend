import { useState } from "react";   
import "./css/Conteiner5WindowConteinerGrupo.css"
import Amigo from "../components/conteinerSvg/amigo";
import { Conteiner5WindowConteinerGrupoValidarRegistro } from "./js/Conteiner5WindowConteinerGrupoValidarRegistro";
import { useUserStore } from "../../useUseSotore";
import Loading4 from "../components/conteinerComponentesJsx/loadind4";
export default function Conteiner5WindowConteinerGrupo () {
    const [grupo , setGrupo] = useState(false)
    const {setTurmaUsuario , dadosUsuario} = useUserStore()
    const [mostrar_loading_grupo , set_mostrar_loading_grupo] = useState(false)
    const condicao_mostrar_loading4 = () => {
        switch(mostrar_loading_grupo){
            case true:
                return(
                    <Loading4 />
                )
        }
    }
    const ativar_grupo = ()=>{
        switch(grupo){
            case true:
                return (
                <div className="Conteiner5WindowConteinerGrupoFormulario">
                    <label htmlFor="nome">Nome Turma</label>
                    <input type="text" placeholder="Digite o nome do Grupo" id="nome_turma" />
                    <label htmlFor="img" className="labelImg">Adicionar imagem da Turma</label>
                    <input type="file" name="img" id="img" style={{display: "none"}} />
                    <div className="Conteiner5WindowConteinerGrupoFormularioBtn">
                        <button onClick={() => Conteiner5WindowConteinerGrupoValidarRegistro(setGrupo , setTurmaUsuario , dadosUsuario?.id , set_mostrar_loading_grupo)}>Criar Turma</button>
                        <button onClick={() => setGrupo(false)}>Cancelar</button>
                    </div>
                    {condicao_mostrar_loading4()}
                </div>  
                )

        }
    }
    return (
        <div className="Conteiner5WindowConteinerGrupo">
            
                <span>
                    <Amigo />
                </span>
                <h3>Criar um novo Grupo</h3>
                <li>
                    Organize a sua equipa e delegue tarefas com facilidade.
                </li>
                <button onClick={() => setGrupo(true)}>Criar Grupo</button>
                {ativar_grupo()}
        </div>
    )
}