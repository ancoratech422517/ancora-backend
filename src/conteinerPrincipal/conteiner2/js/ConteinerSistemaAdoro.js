import { useUserStore } from "../../../useUseSotore";

export async function Sistema_de_adoro_dinamico(id_produto, setEstado_reacao_adoro_classe, estado_reacao_adoro_classe, setValor_quantidade_adoro, valor_atual_contador) {
    
    const store = useUserStore.getState();
    const dados_usuario = store.dadosUsuario;
    const URLBACKEND_ANCORA = store.urlBancoDeDados;
    const atualizarStore = store.setUpdateProdutoAdoro; // esta função eta na minha store nunca esqueça vais chora
    // 1. Definir o novo estado (Inverter o atual)
    const novoEstado = estado_reacao_adoro_classe === "False" ? "True" : "False";

    // 2. ATUALIZAÇÃO OPTIMISTIC (Zustand + Local)
    // Atualiza a Store Global (para que outros componentes saibam)
    atualizarStore(id_produto, novoEstado);

    // Atualiza o estado local do Card (para o feedback visual instantâneo)
    setEstado_reacao_adoro_classe(novoEstado);
    const novo_valor_contador = novoEstado === "True" 
        ? Number(valor_atual_contador) + 1 
        : Number(valor_atual_contador) - 1;
    setValor_quantidade_adoro(novo_valor_contador);

    // 3. Enviar para o Backend
    try {
        let data_user = {
            "id_usuario": dados_usuario.id,
            "id_produto": id_produto
        };

        const response = await fetch(`${URLBACKEND_ANCORA}/sistema_adoro_ancora`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data_user)
        });

        if (!response.ok) {
            throw new Error("Erro ao salvar no banco");
        }
    } catch (error) {
        console.error("Falha no adoro, fazendo rollback:", error);
        // Opcional: Reverter o estado se o fetch falhar
        const estadoInverso = novoEstado === "True" ? "False" : "True";
        atualizarStore(id_produto, estadoInverso);
        setEstado_reacao_adoro_classe(estadoInverso);
        setValor_quantidade_adoro(valor_atual_contador);
    }
}