import { useState , useEffect} from "react";
import "./css/Conteiner5WindowBottom.css"
import Fundo4 from "../../assets/fundo4.jpg"
import Conteiner5WindowBottomCarteiraBox2GraficoBar from "./Conteiner5WindowBottomCarteiraBox2Grafico";
import { useUserStore } from "../../useUseSotore";
import Conteiner5WindowConteinerLeft from "./conteiner5windowConteinerLeft";
import Conteiner5WindowConteinerRight from "./Conteiner5WindowConteinerRight";
import LogoAncora from "../../assets/logo2.png" 
import Multicaixa from "../../assets/multicaixa2.png"
import AncoraPay from "../../assets/ancorapay2.png"
import { ConteinerSendDadosTrafego } from "./js/ConteinerSendDadosTrfego";
import { ConteinerDadosTrafego } from "./js/ConteinerDadosTrafego";
import Loading3 from "../components/conteinerComponentesJsx/loading3";
import { ConteinerDepositarDinheiroNaConta } from "./js/ConteinerDepositarDinheiroNaConta";
export default function Conteiner5WindowBottom () {
    const dadosUsuario = useUserStore((state) => state.dadosUsuario);
    const {MostrarContRightWindow5 , ProdutoUsuario , urlBancoDeDados , MostrarProdutoTrafego , setMostrarProdutoTrafego , setTrafegoEscolhido , trafegoEscolhido , setDadosTrafego , buscar_notificacao , setEstadoConteinerDeposito , estadoConteinerDeposito} = useUserStore()
    const responsivo = window.innerWidth
    const [estadoTrafegoConteiner , setEstadoTrafegoConteiner] = useState("cont1")
    const [estadoTrafegoAtivo , setEstadoTrafegoAtivo] = useState("False")
    const [estadoRespostaTrafego , setEstadoRespostaTrafego] = useState("False")
    const [respostaTrafego , setRespostaTrafego] = useState()
    const [Estado , setEstado] = useState("none")
    const [estadoCarteiraDeposito , setEstadoCarteiraDeposito] = useState("cont1")
    const [estadoMenssageBaner , setEstadoMenssageBaner] = useState("none")
    const getUrlVideo = (url) => {
      if (!url) return "";
        // Verifica se a URL já começa com http ou https
        const isUrlCompleta = url.startsWith("http://") || url.startsWith("https://");
        
        return isUrlCompleta ? url : `${urlBancoDeDados}/${url}`;
      };

    const estadoCondicaoMenssageBaner = ()=>{
        switch(estadoMenssageBaner){
            case "False":
                return(
                    <div className="ConteinerLoadingDeposito">
                        <Loading3 />
                    </div>
                )
            case "True":
                return (
                    <div className="ConteinerLoadingDeposito">
                        <div className="BunnerTopMenssage">
                            Deposito Realizado com sucesso!
                             <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-check-circle-fill" viewBox="0 0 16 16">
                            <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0m-3.97-3.03a.75.75 0 0 0-1.08.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-.01-1.05z"/>
                            </svg>
                        </div>
                    </div>
                )
        }
    }
    const condicaoEstadoCarteiraDeposito = ()=>{
    let valor = []
            
        for (let x = 500; x<=50000; x+=500){
            valor.push(x)
        }
        switch(estadoCarteiraDeposito){
            case "cont1":
                return(
                                <div className="ConteMainConteinerDepositarDinheiro">
                                    <b>Escolha a carteira para sacar o valor do deposito ?</b>
                                        <div className="ConteinerDepositarDinheiroBoxCarteira">
                                            <div className="ConteinerDepositarDinheiroBoxCarteiraIcone">
                                                <img src={Multicaixa} alt="" />
                                            </div>
                                            <div className="ConteinerDepositarDinheiroBoxCarteiraCont" onClick={()=>setEstadoCarteiraDeposito("cont2")}>
                                                Multicaixa Express
                                            </div>
                                        </div>
                                        <div className="ConteinerDepositarDinheiroBoxCarteira">
                                            <div className="ConteinerDepositarDinheiroBoxCarteiraIcone">
                                                <img src={AncoraPay} alt="" />
                                            </div>
                                            <div className="ConteinerDepositarDinheiroBoxCarteiraCont">
                                                AncoraPay
                                            </div>
                                        </div>
        
                                </div>

                )
            case "cont2":
                return (
                                <div className="SecondConteinerDepositarDinheiro">
                                    <label htmlFor="conta">
                                        Digite o numero da sua conta
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-credit-card-2-back-fill" viewBox="0 0 16 16">
                                        <path d="M0 4a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v5H0zm11.5 1a.5.5 0 0 0-.5.5v1a.5.5 0 0 0 .5.5h2a.5.5 0 0 0 .5-.5v-1a.5.5 0 0 0-.5-.5zM0 11v1a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-1z"/>
                                        </svg>
                                    </label>
                                    <input type="text" placeholder="Numero da conta" id="numero_conta" />
                                    <select name="valor" id="valorConta" className="valorConta">
                                       {valor.map((values)=>(
                                        <option key={values} value={values}>{values}</option>
                                       ))}
                                    </select>
                                    <button onClick={ ()=> {ConteinerDepositarDinheiroNaConta(setEstadoMenssageBaner , setEstadoConteinerDeposito , setEstadoCarteiraDeposito)}}>finalizar deposito</button>
                                    
                                </div>

                )
        }
    }
    const condicaoEstadoConteinerDesposito = ()=>{
        switch(estadoConteinerDeposito){
            case "True":
                return (
                            <div className="ConteinerDepositarDinheiro">
                                <div className="CloseConteinerDepositarDinheiro" onClick={()=>{setEstadoConteinerDeposito("False") , setEstadoCarteiraDeposito("cont1")}}>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-x" viewBox="0 0 16 16">
                                    <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708"/>
                                    </svg>
                                </div>
                                {condicaoEstadoCarteiraDeposito()}
                                {estadoCondicaoMenssageBaner()}
                            
                                {/* -------------------------------------------------------------- */}
                            </div>

                )
        }
    }
    


    if (Estado === "buscar"){
        buscar_notificacao(dadosUsuario?.id)
    }

    const condicaoEstadoRespostaTrafego = ()=>{
        switch(estadoRespostaTrafego){
            case "True":
                return (
                    <div className="ConteinerRespostaBackend"> 
                        {respostaTrafego} 
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-check-circle-fill" viewBox="0 0 16 16">
                        <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0m-3.97-3.03a.75.75 0 0 0-1.08.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-.01-1.05z"/>
                        </svg>
                    </div>
                )
            case "Loading":
                return (
                    <div className="ConteineroadingTrafego">
                        <Loading3 />
                    </div>
                )

            
        }
    }
    const condicaoEstadoTrafegoAtivo = ()=>{
        switch(estadoTrafegoAtivo){
            case "True":
                return(
                            <div className="ConteinerEscolhaTipoTrafego">
                                <div className="ConteinerEscolhaTipoTrafegoIcone">
                                    <img src={LogoAncora} alt="" />
                                </div>
                                <h2>Tráfego Pago</h2>
                                <div className="Conteiner_dados_produtos_trafego">
                                    <div className="Conteiner_dados_produtos_trafegoIcone">
                                        <img src={`${trafegoEscolhido.url_imagem_produto}`} alt="" />
                                    </div>
                                    <div className="Conteiner_dados_produtos_trafegoCont">
                                        <b> {trafegoEscolhido.nome_produto} </b>
                                        <h2> {trafegoEscolhido.preco_produto} </h2>
                                    </div>
                                </div>
                                {condicaoEstadoConteinerTrafego()}
                                <div onClick={()=> {setEstadoTrafegoConteiner("cont1") , setEstadoTrafegoAtivo("False")}} className="cancelarTrafego">
                                    Cancelar
                                </div>
                                {condicaoEstadoRespostaTrafego()}
                                
                            </div>

                )
        }
    }
    const condicaoEstadoConteinerTrafego = ()=>{
        switch(estadoTrafegoConteiner){
            case "cont1":
                return (
                        <div className="ConteinerEscolhaTipoTrafegoConteiner1">
                            <label htmlFor="valor">Quanto de envestimento?</label>
                                <select name="valor_envestimento" id="valor_envestimento">
                                    <option value="500">500 Kz</option>
                                    <option value="1000">1000 Kz</option>
                                    <option value="2000">2.000 Kz</option>
                                    <option value="5000">5.000 Kz</option>
                                    <option value="10000">10.000 Kz</option>
                                </select>
                                <label htmlFor="publico_alvo">Publico Alvo</label>
                                <select name="publico_alvo" id="publico_alvo">
                                    <option value="10 17">dos 10 a 17 anos</option>
                                    <option value="18 35"> dos 18 a 35 anos</option>
                                    <option value="35 50">dos 35 a 60 anos</option>
                                    <option value="todos"> todos publico alvo</option>
                                </select>
                                <button onClick={()=> {ConteinerDadosTrafego(trafegoEscolhido, setDadosTrafego , dadosUsuario) , setEstadoTrafegoConteiner("cont2")}}>Proximo</button>
                            </div>

                )
            case "cont2":
                return (
                         
                                <div className="ConteinerEscolhaTipoTrafegoCnteinerCarteira">
                                    <h3>Escolha a sua carteira digital</h3>
                                    <div className="ConteinerEscolhaTipoTrafegoCnteinerCarteiraBox">
                                        <div className="ConteinerEscolhaTipoTrafegoCnteinerCarteiraBoxIcone">
                                            <img src={Multicaixa} alt="" />
                                        </div>
                                        <button onClick={()=> setEstadoTrafegoConteiner("cont3")} className="orange_carteira">Multicaixa Express</button>
                                    </div>

                                    <div className="ConteinerEscolhaTipoTrafegoCnteinerCarteiraBox">
                                        <div className="ConteinerEscolhaTipoTrafegoCnteinerCarteiraBoxIcone">
                                            <img src={AncoraPay} alt="" />
                                        </div>
                                        <button className="teal_carteira">AncoraPay</button>
                                    </div>
                                </div>

                )
            case "cont3":
                return(
                                <div className="ConteinerEscolhaTipoTrafegoConteinerTipoPagamentoExpress">
                                    <label htmlFor="numero_conta">Digite o Numero da sua conta </label>
                                    <input type="text" placeholder="+244 ••• ••• •••" />
                                    <button onClick={()=> ConteinerSendDadosTrafego(setEstadoRespostaTrafego , setRespostaTrafego , setEstadoTrafegoConteiner , setEstadoTrafegoAtivo , setEstado)}>Finalizar Trafego Pago</button>
                                </div>

                )
        }
    }
    const condicaoEstadoMenuTrafego  = ()=>{
        switch(MostrarProdutoTrafego){
            case "True":
                return (
                            <div className="ConteinerBoxProdutosEscolhaTrafego">
                                <div className="ConteinerBoxProdutosEscolhaTrafegoMenu">
                                    <input type="text" placeholder="pesquisar Produto" />
                                    <button>buscar</button>
                                    <button onClick={()=> MostrarProdutoTrafego == "True" ? setMostrarProdutoTrafego("false"): setMostrarProdutoTrafego("True")}>cancelar</button>
                                </div>
                                <div className="ConteinerBoxProdutosEscolhaTrafegoScroll">
                                        {Array.isArray(ProdutoUsuario) && ProdutoUsuario.length > 0 ? (
                                            ProdutoUsuario.map((item , index)=>(
                                                <div className="ConteinerBoxProdutosEscolhaTrafegoScrollDados">
                                                    <div className="ConteinerBoxProdutosEscolhaTrafegoScrollDadosIcone">
                                                        <img src={`${getUrlVideo(item.url_imagem_produto)}`} alt="" />
                                                    </div>
                                                    <div className="ConteinerBoxProdutosEscolhaTrafegoScrollDadosCont">
                                                        <b> {item.nome_produto} </b>
                                                        <h3> {item.preco_produto} </h3>
                                                    </div>
                                                    <button onClick={()=> setTrafegoEscolhido(item , setMostrarProdutoTrafego("false") , setEstadoTrafegoAtivo("True"))}>publicitar</button>
                                                </div>
                                            ))
                                        ):(
                                            <b>nenhum dados do usuario encontrado</b>
                                        )}
                                </div>
                             </div>

                )
        }
    }
    const Mostrar = ()=>{
        if (window.innerWidth<=880){

        switch(MostrarContRightWindow5){
            case true:
                return (
                    <div className="Conteiner5WindowBottom">
                        <Conteiner5WindowConteinerRight />
                        {condicaoEstadoConteinerDesposito()}
                        {condicaoEstadoMenuTrafego()}
                        {condicaoEstadoTrafegoAtivo()}
                        
                    </div>
                );
            case false:
                return (
                    <div className="Conteiner5WindowBottom">
                        <Conteiner5WindowConteinerLeft />
                    </div>
                );
            default:
                return (
                    <div className="Conteiner5WindowBottom">
                        <Conteiner5WindowConteinerLeft />
                    </div>
                );
        }

        }
        else{

            return (

                    <div className="Conteiner5WindowBottom">
                            <Conteiner5WindowConteinerLeft />
                            <Conteiner5WindowConteinerRight />
                            {condicaoEstadoMenuTrafego()}
                            {condicaoEstadoTrafegoAtivo()}
                            {condicaoEstadoConteinerDesposito()}
                     </div>

            )
        }

    }

    return (
        Mostrar()
    )
}
// {Mostrar()}