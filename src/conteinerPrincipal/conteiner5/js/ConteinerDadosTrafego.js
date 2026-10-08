import { useUserStore } from "../../../useUseSotore"
export function ConteinerDadosTrafego (trafegoEscolhido  , setDadosTrafego , dadosUsuario) {
    const DadosTrafegoTeste = useUserStore.getState().dadosTrafego
    let valor_envestimento = document.getElementById("valor_envestimento").value
    let publico_alvo = document.getElementById("publico_alvo").value

    const DadosTrafegouser = {
        "nome_produto":trafegoEscolhido.nome_produto,
        "preco_produto":trafegoEscolhido.preco_produto,
        "id_usuario": dadosUsuario.id,
        "id_produto":trafegoEscolhido.id,
        "valor_envestimento":valor_envestimento,
        "publico_alvo":publico_alvo,
        "imagem_produto":trafegoEscolhido.url_imagem_produto,
        "tipo_produto":trafegoEscolhido.tipo_produto,
        "nome_usuario":dadosUsuario.nome,
        "telefone_usuario":dadosUsuario.telefone,
        "pais":dadosUsuario.pais,
        "provincia":dadosUsuario.provincia,
        "capital":dadosUsuario.capital,
        "bairro":dadosUsuario.bairro
    }
    alert(DadosTrafegouser.nome_produto)
    setDadosTrafego(DadosTrafegouser)
 

}