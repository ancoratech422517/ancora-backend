
export function AdicionarFundoPontoAOChat(){
 console.log("boas")
 try{
 let ConeinerRightConteudo_fundo_po = document.querySelector(".ConeinerRightConteudo-fundo-po")
    let dadosPonto = `
        <div className="ConeinerRightConteudo-fundo-po-my-ponto"></div>
    `

        ConeinerRightConteudo_fundo_po.appendChild(dadosPonto)
 
 }
catch(erro){
  console.log("erro ao adicionar os pontos")
}
   
}
AdicionarFundoPontoAOChat()