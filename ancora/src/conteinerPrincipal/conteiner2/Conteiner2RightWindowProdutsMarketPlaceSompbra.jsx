import { useEffect, useState } from "react";
import "./css/Conteiner2RightWindowProdutsSombra.css"
import Conteiner2RightWindowProdutsSombraCard from "./Conteiner2RightWindowProdutsSombraCard";
import Conteiner2RightWindowProddutoCompra from "./conteiner2RightWindowProdutoCompra";
import { useUserStore } from "../../useUseSotore";
export default function Conteiner2RightWindowProdutsSombra () {
    
    const [Estado , setEstado] = useState("produto")
    
    const estado_ = () =>{
        switch(Estado){
            case "produto":
                return <Conteiner2RightWindowProdutsSombraCard setEstado={setEstado} />
                    
            case "E_carteira":
                return <Conteiner2RightWindowProddutoCompra setEstado={setEstado} />

            default:
                return <Conteiner2RightWindowProdutsSombraCard setEstado={setEstado} />
                     

        }
    }

    return (
        <div className="Conteiner2RightWindowProdutsSombra">
            {estado_()}
        </div>
    )
}