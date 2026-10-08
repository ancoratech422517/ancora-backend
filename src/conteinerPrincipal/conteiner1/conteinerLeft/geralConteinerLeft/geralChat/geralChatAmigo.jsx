import { useState , useEffect } from "react";
import "../css/GeralChatAmigo.css"
import Amigo from "../../../../components/conteinerSvg/amigo";
import GeralChatAmigoDados from "./geralChatAmigoDados";
import { GeraChatDadosAmigos } from "../js/geralChatDadosAmigos";
import SetaEsquerda from "../../../../components/conteinerSvg/setaEsquerda";
import { useUserStore } from "../../../../../useUseSotore";
export default function GeralChatAmigo ({setViewChat}) {
    const {socket , setMenssagemNaoLida} = useUserStore()
    const [listar_usuario , setListarUsuario] = useState([])
    useEffect(()=>{
        const carregar =  async ()=>{
            const dados = await GeraChatDadosAmigos()
            setListarUsuario(dados)
        }
        carregar()
    } , [])
    return (
        <div className="GeralChatAmigo">
            <div className="GeralChatAmigoMenu">
                <div className="GeralChatAmigoMenuBox">
                    <div className="GeralChatAmigoMenuBoxCaxa1">
                        <button onClick={()=> setViewChat("chat")}>
                            <SetaEsquerda />
                        </button>
                    </div>
                    <div className="GeralChatAmigoMenuBoxCaxa2">
                        <h2>Amigo</h2>
                        <Amigo />
                    </div>
                </div>
                <div className="GeralChatAmigoMenuBox">
                    <input type="serch" placeholder="Pesquisar Amigo" id="search"/>
                </div>
            </div>
            <div className="GeralChatAmigoConteinerScroll">
                {listar_usuario.map((usuario)=>(
                    <GeralChatAmigoDados key={usuario.id} dados = {usuario} />
                ))}
                
            </div>
        </div>
    )
}