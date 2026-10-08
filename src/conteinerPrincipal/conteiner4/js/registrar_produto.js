import { useUserStore } from "../../../useUseSotore";
export async function Registrar_produto(even, id_usuario , dadosUsuario_nome) {
    // 1. Pegar as referências dos elementos
    const URL_BACKEND_ANCORA = useUserStore.getState().urlBancoDeDados
    const nome = document.getElementById("nome").value;
    const descricao = document.getElementById("descricao").value;
    const tipo = document.getElementById("tipo").value;
    const preco = document.getElementById("preco").value;
    const inputImagem = document.getElementById("imagem");

    // 2. Verificar se existe um arquivo selecionado
    if (!inputImagem || inputImagem.files.length === 0) {
        alert("Por favor, selecione uma imagem.");
        return;
    }

    const arquivo = inputImagem.files[0];

    
    // 3. Criar o FormData e preencher
    const formdata = new FormData();
    formdata.append("imagem_produto", arquivo);
    formdata.append("nome_produto", nome);
    formdata.append("descricao_produto", descricao);
    formdata.append("preco_produto", preco);
    formdata.append("id_usuario", id_usuario);
    formdata.append("tipo_produto" , tipo)
    formdata.append("nome_vendedor" , dadosUsuario_nome)

    // 4. Enviar imediatamente
    try {
        const registrar_produto_usuario = await fetch(`${URL_BACKEND_ANCORA}/registrar_produto`, {
            method: "POST", // Use maiúsculas por convenção
            body: formdata
            // Nota: NÃO defina 'Content-Type' manualmente ao usar FormData. 
            // O navegador faz isso sozinho com o "boundary" correto.
        });

        const get_response = await registrar_produto_usuario.json();
    } catch (erro) {
        console.error("Erro na requisição:", erro);
        alert("Erro ao conectar com o servidor.");
    }
}