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
  const [darkMode, setDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem("ancora-theme");
    const theme = savedTheme === "dark" || savedTheme === "light"
      ? savedTheme
      : (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    document.documentElement.dataset.theme = theme;
    return theme === "dark";
  });

  const alternarTema = () => {
    const theme = darkMode ? "light" : "dark";
    document.documentElement.dataset.theme = theme;
    localStorage.setItem("ancora-theme", theme);
    setDarkMode(theme === "dark");
  };

    return (
        <div className="boxTopMenuConteinerLeft">
           <div className="boxTopMenuConteinerLeftBTN">
             <Button2 ativarConteiner={ativarConteiner}/>
             {/* <li>Chat</li> */}

           </div>
           <div className="boxTopMenuConteinerLeftBTN">
             <Button3 ativarConteiner={ativarConteiner}/>
             {/* <li>Loja</li> */}
           </div>
           <div className="boxTopMenuConteinerLeftBTN">
             <Button7 ativarConteiner={ativarConteiner}/>
             {/* <li>Painel</li> */}
           </div>
           <div className="boxTopMenuConteinerLeftBTN">
             <Button4 ativarConteiner={ativarConteiner}/>
            
           </div>
           
           {/* <div className="boxTopMenuConteinerLeftBTN">
             <Button9 ativarConteiner={ativarConteiner}/>
             <li>feeds</li>
           </div> */}
           <div className="boxTopMenuConteinerLeftBTN">
             <Button5 ativarConteiner={ativarConteiner} setDadosUsuario={setDadosUsuario} />
             {/* <li>Perfil</li> */}
           </div>
           <div className="boxTopMenuConteinerLeftBTN">
             <button
               className="theme-toggle"
               type="button"
               onClick={alternarTema}
               aria-label={darkMode ? "Ativar tema claro" : "Ativar tema escuro"}
               title={darkMode ? "Ativar tema claro" : "Ativar tema escuro"}
             >
               <svg viewBox="0 0 24 24" aria-hidden="true">
                 <path d="M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5Z" />
               </svg>
             </button>
           </div>
        </div>
    )
}

// agora analiza bem a minha UI no que toca as paletas de cor na hora de alternar de modo escuro , nem todas os elementos na minha UI teem variaveis de ambiante , algumas eu mete mesmo assim a puro , entao tens que ver la issoo e trocar , tambem a imagem de fundo do chat de conversa tem que trocar ou veja uma imagem de fundo preto que condiz com o tema escuro na inaternet ou mete apenas uma paleta de cor em vez de imagem

