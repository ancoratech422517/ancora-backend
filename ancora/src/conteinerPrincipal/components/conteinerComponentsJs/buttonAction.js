
export async function ClicarButtom(event , setAtivar , nome , setDadosUsuario) {
 
  const botoes = document.querySelectorAll(".btn3");
  

  // remove active de todos
  botoes.forEach((btn) => {
    btn.classList.remove("active");
  });

  // adiciona no clicado
  event.currentTarget.classList.add("active");
  if(setAtivar){
   
    if (nome === "conteiner5"){
      const token = localStorage.getItem("token_sessao")
      
      const dados_token = {
        "token":token
      }

      // const send_token = await fetch("http://localhost:5000/api/getDatePerfil" , {
      //   method:"post" , 
      //   headers:{
      //     "Content-Type":"application/json"
      //   },
      //   body:JSON.stringify(dados_token)
      // })
       

      // const response_token = await send_token.json()
      
      // setAtivar(nome)
      // if (setDadosUsuario){
      //    setDadosUsuario(response_token)
      //  }
       
      
    }
    
    
  }
  setAtivar(nome)

}

