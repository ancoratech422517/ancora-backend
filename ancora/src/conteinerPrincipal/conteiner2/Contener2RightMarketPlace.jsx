import { useState } from "react";
import "./css/Conteiner2RightMarketPlace.css"
import Conteiner2MenuTopMarketPlace from "./Conteiner2MenuTopMarketPlace";
import ConteinerRightWindowProdutsScroll from "./ConteinerRightWindowProdutsScroll";
import Conteiner2RightWindowProdutsSombra from "./Conteiner2RightWindowProdutsMarketPlaceSompbra";
import Conteiner2SearchProduto from "./Conteiner2SearchProduto";
import Colecao from "../../assets/colecao.jpg"
import { useUserStore } from "../../useUseSotore";
export default function Conteiner2RightMarketPlace () {
    const [pesquisaProduto, setPesquisaProduto] = useState("")
    const {estadoMenu , setEstadoMenu} = useUserStore()
    const condicaoEstadoMenu = ()=>{
        switch(estadoMenu){
            case "ativar":
                return (


            <div className="MenuPesquisarProdutos">
                <div className="MenuPesquisarProdutosBox">
                    <h3>Categoria</h3>
                    <li>Telefone</li>
                    <li>Computador</li>
                    <li>Eletronico</li>
                    <li>Moda</li>
                    <li>Outros</li>
                </div>
                <div className="MenuPesquisarProdutosBox">
                    <h3>Coleção</h3>
                    <li>New Arrivals</li>
                    <li>Bestllaers</li>
                    <li>Premiun</li>
                    <li>Seller</li>
                    <li>Vistos</li>
                </div>
                <div className="MenuPesquisarProdutosBox">
                    <img src={Colecao} alt="" />
                    <b>Sumario de Coleção</b>
                </div>
            </div>


                )
        }
    }
    return (
        <div className="Conteiner2RightMarketPlace">
            <Conteiner2MenuTopMarketPlace pesquisaProduto={pesquisaProduto} setPesquisaProduto={setPesquisaProduto} />
            <ConteinerRightWindowProdutsScroll pesquisaProduto={pesquisaProduto} />
            <Conteiner2RightWindowProdutsSombra />
            {condicaoEstadoMenu()}
        </div>

    )
}
