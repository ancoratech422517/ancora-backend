import { useState } from "react";   
import "./css/Conteiner5WindowConteinerGrupo.css"
import Amigo from "../components/conteinerSvg/amigo";
export default function Conteiner5WindowConteinerGrupo () {
    const [grupo , setGrupo] = useState(false)
    const ativar_grupo = ()=>{
        switch(grupo){
            case true:
                return (
                <div className="Conteiner5WindowConteinerGrupoFormulario">
                    <label htmlFor="nome">Nome Grupo</label>
                    <input type="text" placeholder="Digite o nome do Grupo" />
                    <label htmlFor="img" className="labelImg">Adicionar imagem do grupo</label>
                    <input type="file" name="img" id="img" style={{display: "none"}} />
                    <div className="Conteiner5WindowConteinerGrupoFormularioBtn">
                        <button>Criar Grupo</button>
                        <button onClick={() => setGrupo(false)}>Cancelar</button>
                    </div>
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