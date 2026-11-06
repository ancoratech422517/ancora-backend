export function ehMensagemAudio(mensagem) {
    return typeof mensagem === "string" && mensagem.startsWith("data:audio/");
}

export function tipoPreviaMensagem(mensagem) {
    if (ehMensagemAudio(mensagem)) return "audio";
    if (typeof mensagem !== "string") return null;

    try {
        const conteudo = JSON.parse(mensagem);
        if (conteudo?.isFile) {
            if (typeof conteudo.mimeType === "string") {
                if (conteudo.mimeType.startsWith("image/")) return "imagem";
                if (conteudo.mimeType.startsWith("audio/")) return "audio";
            }
            return "ficheiro";
        }
    } catch {
        return null;
    }

    return null;
}
