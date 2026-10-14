import { useUserStore } from "../../../useUseSotore";

export async function Conteiner_Chamada_Grupo(sala) {
    const store = useUserStore.getState();
    let socket = store.socket;

    try {
        if (!socket?.connected) {
            socket = await store.conectarSocket();
        }

        if (!socket?.connected) {
            await new Promise((resolve, reject) => {
                const onConnect = () => {
                    clearTimeout(timeout);
                    socket.off("connect", onConnect);
                    resolve();
                };
                const timeout = setTimeout(() => {
                    socket.off("connect", onConnect);
                    reject(new Error("Tempo esgotado ao conectar o socket"));
                }, 10000);
                socket.once("connect", onConnect);
            });
        }

        const idRemetente = useUserStore.getState().dadosUsuario?.id;
        if (!idRemetente) {
            return { ok: false, erro: "Utilizador remetente não identificado" };
        }

        return await new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                reject(new Error("O servidor não confirmou o envio da chamada"));
            }, 10000);

            socket.emit("chamada_grupo", { sala, id_remitente: idRemetente }, (resposta) => {
                clearTimeout(timeout);
                if (!resposta?.ok) {
                    reject(new Error(resposta?.erro || "O servidor recusou a chamada"));
                    return;
                }
                resolve(resposta);
            });
        });
    } catch (erro) {
        console.error("Não foi possível notificar os alunos da turma:", erro);
        return { ok: false, erro: erro.message };
    }
}













