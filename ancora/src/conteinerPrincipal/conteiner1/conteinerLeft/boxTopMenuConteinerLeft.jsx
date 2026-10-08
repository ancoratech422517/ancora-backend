import { useState } from "react";
import "./css/boxTopMenuConteinerLeft.css"
import Button1 from "../../components/conteinerComponentesJsx/btn1";
import Button2 from "../../components/conteinerComponentesJsx/btn2";
import Button3 from "../../components/conteinerComponentesJsx/btn3";
import Button4 from "../../components/conteinerComponentesJsx/btn4"
import Button5 from "../../components/conteinerComponentesJsx/btn5"
import Button7 from "../../components/conteinerComponentesJsx/btn7";
import Button8 from "../../components/conteinerComponentesJsx/btn8";
import Button9 from "../../components/conteinerComponentesJsx/btn9";
export default function BoxTopMenuConteinerLeft({ativarConteiner , setDadosUsuario}){
    return (
        <div className="boxTopMenuConteinerLeft">
           <div className="boxTopMenuConteinerLeftBTN">
             <Button2 ativarConteiner={ativarConteiner}/>
             <li>conversa</li>
           </div>
           <div className="boxTopMenuConteinerLeftBTN">
             <Button3 ativarConteiner={ativarConteiner}/>
             <li>Loja</li>
           </div>
           <div className="boxTopMenuConteinerLeftBTN">
             <Button7 ativarConteiner={ativarConteiner}/>
             <li>Painel</li>
           </div>
           {/* <div className="boxTopMenuConteinerLeftBTN">
             <Button4 ativarConteiner={ativarConteiner}/>
             <li>pedidos</li>
           </div> */}
           {/* <div className="boxTopMenuConteinerLeftBTN">
             <Button9 ativarConteiner={ativarConteiner}/>
             <li>feeds</li>
           </div> */}
           <div className="boxTopMenuConteinerLeftBTN">
             <Button5 ativarConteiner={ativarConteiner} setDadosUsuario={setDadosUsuario} />
             <li>Perfil</li>
           </div>
        </div>
    )
}

