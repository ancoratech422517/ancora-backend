import { useUserStore } from "../../../useUseSotore";
import { optimizeImage } from "../../../utils/imageOptimizer";
import { fetchComAuth } from "../../../utils/api";

export async function Registrar_produto(event, id_usuario, dadosUsuario_nome, onSuccess) {
    event.preventDefault();
    const formulario = event.currentTarget;
    const dadosFormulario = new FormData(formulario);
    const URL_BACKEND_ANCORA = useUserStore.getState().urlBancoDeDados
    const nome = String(dadosFormulario.get("nome_produto") || "").trim();
    const descricao = String(dadosFormulario.get("descricao_produto") || "").trim();
    const tipo = String(dadosFormulario.get("tipo_produto") || "").trim();
    const preco = String(dadosFormulario.get("preco_produto") || "").trim();
    const arquivoOriginal = dadosFormulario.get("imagem_produto");

    if (!nome.trim() || nome.trim().length > 65) {
        alert("O nome do produto deve ter entre 1 e 65 caracteres.");
        return;
    }
    if (!descricao || descricao.length > 10000) {
        alert("A descrição deve ter entre 1 e 10000 caracteres.");
        return;
    }
    if (!tipo || tipo.length > 80) {
        alert("O tipo de produto é inválido.");
        return;
    }

    if (!(arquivoOriginal instanceof File) || arquivoOriginal.size === 0) {
        alert("Por favor, selecione uma imagem.");
        return;
    }

    const formdata = new FormData();
    formdata.append("nome_produto", nome);
    formdata.append("descricao_produto", descricao);
    formdata.append("preco_produto", preco);
    formdata.append("id_usuario", id_usuario);
    formdata.append("tipo_produto" , tipo)
    formdata.append("nome_vendedor" , dadosUsuario_nome)

    try {
        const otimizado = await optimizeImage(arquivoOriginal, "feed");
        const arquivo = otimizado.file;
        formdata.append("imagem_produto", arquivo);
        formdata.append("imagem_blurhash", otimizado.blurHash || "");
        const registrar_produto_usuario = await fetchComAuth(`${URL_BACKEND_ANCORA}/registrar_produto`, {
            method: "POST",
            body: formdata
        });

        const get_response = await registrar_produto_usuario.json();
        if (!registrar_produto_usuario.ok) {
            throw new Error(get_response.error || get_response.mensagem || "Não foi possível registar o produto.");
        }
        formulario.reset();
        window.alert(tipo === "Cursos" ? "Curso registado com sucesso." : "Produto registado com sucesso.");
        onSuccess?.();
    } catch (erro) {
        console.error("Erro na requisição:", erro);
        alert(erro.message || "Não foi possível registar o produto.");
    }
}
