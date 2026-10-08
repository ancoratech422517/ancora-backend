import { useState } from "react";
import "./css/Contener3WindowRight.css"
import Conteiner3WindowRightDadosPedidos from "./Conteiner3WindowRightDados";
import { useUserStore } from "../../useUseSotore";
export default function Conteiner3WindowRight () {
    const {PedidosProdutos} = useUserStore()
    const [estadoPedido , setEstadoPedido] = useState("meus_pedidos")
    const pedidos = ()=>{
        switch(estadoPedido){
            case "meus_pedidos":
                return (
                    <div className="Conteiner3WindowRightScrollPedidos">
                        {PedidosProdutos.map((dadosPedidos)=>(
                            <Conteiner3WindowRightDadosPedidos dados={dadosPedidos} />
                        )
                        )}
                    </div>

                )
            case "cliente":
                return (
                    <div className="Conteiner3WindowRightScrollPedidos">
                        <Conteiner3WindowRightDadosPedidos />
                        <Conteiner3WindowRightDadosPedidos />
                        <Conteiner3WindowRightDadosPedidos />

                    </div>

                )
        }
    }
    return (
        <div className="Contener3WindowRight">
            <div className="Conteiner3WindowRightMenuTop">
                <button onClick={()=> setEstadoPedido("meus_pedidos")}>Meus pedidos</button>
                <button onClick={()=> setEstadoPedido("cliente")}>Pedidos dos Clientes</button>
            </div>
            {pedidos()}
        </div>
    )
}