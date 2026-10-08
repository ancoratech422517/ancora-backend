import { useState } from "react";
import "./css/Conteiner4RightWindow.css"
import Conteiner4ConteinerDashboard from "./Conteiner4ConteinerDashboard";
import Conteiner4ConteinerProduto from "./Conteiner4ConteinerProdduto";
import Conteiner4RighrWindowMenuTop from "./Conteiner4RightWindowMenuTop";
import Conteiner4CoteinerCliente from "./Conteiner4ConteinerCliente";
import Conteiner4ConteinerAfifliado from "./Conteiner4ConteinerAfiliado";
import Conteiner4ConteinerLucro from "./Conteiner4ConteinerLucro";
import Logo2 from "../../assets/logo2.png"
import Capa from "../../assets/fundoLogin.jpg"
import Erro from "../components/conteinerSvg/erro";
import { Registrar_produto } from "./js/registrar_produto";
import { useUserStore } from "../../useUseSotore";
import { Tirar_formulario } from "./js/tirar_formulario";
export default function Conteiner4RightWindow () {
    const [telaAtiva , setTelaAtiva] = useState("dashboard")
    const {socket , dadosUsuario} = useUserStore()
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
            {RenderizarConteiner()}
            <div className="Conteiner4ConteinerProdutoFormulario">
                {/* INICIO DA FORMATAÇÃO DO NOVO PRODUTO */}
                <div className="novo_produto">
                    <div className="novo_produto_capa">
                        <img src={Capa} alt="" />
                    </div>
                    <div className="novo_produto_inputs">
                        <div className="tirar_formulario" onClick={Tirar_formulario}>
                            <Erro />
                        </div>
                        <div className="novo_produto_inputs_logo">
                            <img src={Logo2} alt="" />
                        </div>
                        
                        <input id="nome" type="text" placeholder="Nome do produto" />
                        <input id="descricao" type="text" placeholder="Descrição do produto" />
                        <select id="tipo">
                            <option id="moda" value="Moda">Moda</option>
                            <option id="eletronica" value="Eletronica">Eletronica</option>
                            <option id="Curos" value="Cursos">Cursos</option>
                            <option id="telefone" value="telefones">Telefones</option>
                            <option id="computadore" value="computadores">Computadores</option>
                            <option id="opcional" value="opcional">Outros</option>
                        </select>
                        <input id="preco" type="text" placeholder="Preço do produto" />
                        <label htmlFor="imagem">carregar imagem</label>
                        <input  type="file" style={{display:"none"}} id="imagem" />
                        
                        <button onClick={(e)=> Registrar_produto(e , dadosUsuario.id , dadosUsuario.nome)}>Registrar produto</button>
                    </div>
                </div>
                {/* FIM DA FORMATAÇÃO DO NOVO PRODUTO */}
            </div>
        </div>
    )
}

