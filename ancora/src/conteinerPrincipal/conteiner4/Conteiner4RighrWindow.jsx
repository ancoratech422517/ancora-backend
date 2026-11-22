import { useState } from "react";
import "./css/Conteiner4RightWindow.css"
import Conteiner4ConteinerDashboard from "./Conteiner4ConteinerDashboard";
import Conteiner4ConteinerProduto from "./Conteiner4ConteinerProdduto";
import Conteiner4RighrWindowMenuTop from "./Conteiner4RightWindowMenuTop";
import Conteiner4CoteinerCliente from "./Conteiner4ConteinerCliente";
import Conteiner4ConteinerAfifliado from "./Conteiner4ConteinerAfiliado";
import Conteiner4ConteinerLucro from "./Conteiner4ConteinerLucro";
import Capa from "../../assets/fundoLogin.jpg"
import Erro from "../components/conteinerSvg/erro";
import { Registrar_produto } from "./js/registrar_produto";
import { useUserStore } from "../../useUseSotore";
import { Tirar_formulario } from "./js/tirar_formulario";
export default function Conteiner4RightWindow () {
    const [telaAtiva , setTelaAtiva] = useState("dashboard")
    const [cursoAtivo, setCursoAtivo] = useState(false)
    const {dadosUsuario} = useUserStore()
    const fecharFormulario = () => {
        setCursoAtivo(false)
        Tirar_formulario()
    }

    const registarItem = (event) => {
        void Registrar_produto(event, dadosUsuario.id, dadosUsuario.nome, () => {
            setCursoAtivo(false)
            Tirar_formulario()
        })
    }

    const RenderizarConteiner = ()=>{
        switch(telaAtiva){
            case "dashboard":
                return <Conteiner4ConteinerDashboard />
            case "produto":
                return <Conteiner4ConteinerProduto />
            case "cliente":
                return <Conteiner4CoteinerCliente />
            case "afiliado":
                return <Conteiner4ConteinerAfifliado />
            case "lucro":
                return <Conteiner4ConteinerLucro  />
            default:
                return <Conteiner4ConteinerDashboard />
        }
    }
    return (
        <div className="Conteiner4RightWindow">
            <Conteiner4RighrWindowMenuTop ativarConteiner = {setTelaAtiva} />
            <div className={`Conteiner4RightWindowConteudo${telaAtiva === "cliente" ? " Conteiner4RightWindowConteudo--cliente" : ""}${telaAtiva === "afiliado" ? " Conteiner4RightWindowConteudo--afiliado" : ""}`}>
                {RenderizarConteiner()}
            </div>
            <div className="Conteiner4ConteinerProdutoFormulario">
                {/* INICIO DA FORMATAÇÃO DO NOVO PRODUTO */}
                <div className="novo_produto">
                    <div className="novo_produto_capa">
                        <img src={Capa} alt="" />
                    </div>
                    <form className={`novo_produto_inputs${cursoAtivo ? " is-course-form" : ""}`} onSubmit={registarItem}>
                        <div className="tirar_formulario" onClick={fecharFormulario}>
                            <Erro />
                        </div>
                        <div className="novo_produto_inputs_logo">

                        </div>
                        {cursoAtivo ? (
                            <>
                                <h3 className="novo_produto_form_titulo">Registar curso</h3>
                                <input name="nome_produto" type="text" placeholder="Nome do curso" maxLength={65} required />
                                <textarea name="descricao_produto" placeholder="Descrição do curso" maxLength={10000} required />
                                <input name="preco_produto" type="number" min="0.01" step="any" inputMode="decimal" placeholder="Preço do curso (Kz)" required />
                                <input name="tipo_produto" type="hidden" value="Cursos" readOnly />
                                <label htmlFor="imagem-curso">Carregar capa do curso</label>
                                <input name="imagem_produto" type="file" accept="image/*" style={{display:"none"}} id="imagem-curso" />
                                <button type="submit">Registar curso</button>
                                <button type="button" className="novo_produto_curso" onClick={() => setCursoAtivo(false)}>Voltar ao produto</button>
                            </>
                        ) : (
                            <>
                                <input name="nome_produto" type="text" placeholder="Nome do produto" maxLength={65} required />
                                <input name="descricao_produto" type="text" placeholder="Descrição do produto" maxLength={10000} required />
                                <select name="tipo_produto" defaultValue="Moda">
                                    <option value="Moda">Moda</option>
                                    <option value="Eletronica">Eletrónica</option>
                                    <option value="Cursos">Cursos</option>
                                    <option value="telefones">Telefones</option>
                                    <option value="computadores">Computadores</option>
                                    <option value="opcional">Outros</option>
                                </select>
                                <input name="preco_produto" type="number" min="0.01" step="any" inputMode="decimal" placeholder="Preço do produto (Kz)" required />
                                <label htmlFor="imagem-produto">Carregar imagem</label>
                                <input name="imagem_produto" type="file" accept="image/*" style={{display:"none"}} id="imagem-produto" />
                                <button type="submit">Registar produto</button>
                                <button type="button" className="novo_produto_curso" onClick={() => setCursoAtivo(true)}>Vender um curso</button>
                            </>
                        )}
                    </form>
                </div>
                {/* FIM DA FORMATAÇÃO DO NOVO PRODUTO */}
            </div>
        </div>
    )
}
