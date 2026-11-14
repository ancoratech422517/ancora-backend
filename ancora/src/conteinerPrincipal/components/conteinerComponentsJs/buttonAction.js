
export async function ClicarButtom(event , setAtivar , nome) {
 
  const botoes = document.querySelectorAll(".btn3");
  

  // remove active de todos
  
  botoes.forEach((btn) => {
    btn.classList.remove("active");
  });

  // adiciona no clicado
  event.currentTarget.classList.add("active");
  setAtivar(nome)

}

