import { useState, useEffect, useRef } from "react";
import "./css/ConteinerRightMenuBottom.css";
import Arquivo from "../../components/conteinerSvg/arquivo";
import Imoge from "../../components/conteinerSvg/imoge";
import Send from "../../components/conteinerSvg/send";
import { useUserStore } from "../../../useUseSotore";
import { Enviar_menssagem } from "../../../service/socket_service_enviar_menssagem";
import EmojiPicker, { Theme as EmojiTheme } from 'emoji-picker-react';
import Erro from "../../components/conteinerSvg/erro";
import Audio from "../../components/conteinerSvg/audio";
import Editar from "../../components/conteinerSvg/editar";
import Reencaminhar from "../../components/conteinerSvg/reencaminhar";
import Responder from "../../components/conteinerSvg/responder";
import Denunciar from "../../components/conteinerSvg/denunciar";
import { Eliminar_menssagem } from "./js/eliminar_menssagem";
import { TirarSelecao } from "./js/TirarSelecao";
import { fetchComAuth } from "../../../utils/api";

export default function ConteinerRightMenuBottom() {
    const { 
        ChatAtivo, 
        socket, 
        dadosUsuario, 
        setQuantidadeMensagemNaoLida, 
        menssagens, 
        editar_menssagem_no_array, 
        setMenssagem , 
        urlBancoDeDados,
        setIdMenssagem
    } = useUserStore();
    const { IdMenssagem } = useUserStore();
    
    const [texto, setTexto] = useState("");
    const [editandoID, setEditandoID] = useState(null);
    const [salvandoEdicao, setSalvandoEdicao] = useState(false);
    const [replyTo, setReplyTo] = useState(null);

    const [mostrarPicker, setMostrarPicker] = useState(false);
    const [mostrarGifs, setMostrarGifs] = useState(false);
    const [mostrarMenuMedia, setMostrarMenuMedia] = useState(false);
    const [temaEscuro, setTemaEscuro] = useState(() => document.documentElement.dataset.theme === "dark");
    const [gifs, setGifs] = useState([]);
    const [gravando, setGravando] = useState(false);

    const timeoutRef = useRef(null);
    const mediaRecorderRef = useRef(null);
    const chunksRef = useRef([]);
    const streamRef = useRef(null);                    

    const fileInputRef = useRef(null);

    // ===================== ESTADOS DO PROGRESSO =====================
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [uploadedBytes, setUploadedBytes] = useState(0);
    const [uploadSpeed, setUploadSpeed] = useState(0);
    const [timeRemaining, setTimeRemaining] = useState(0);
    const [fileInfo, setFileInfo] = useState({ name: "", totalSize: 0 });

    const xhrRef = useRef(null);
    const uploadStartTimeRef = useRef(null);

    useEffect(() => {
        const observer = new MutationObserver(() => {
            setTemaEscuro(document.documentElement.dataset.theme === "dark");
        });
        observer.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ["data-theme"],
        });
        return () => observer.disconnect();
    }, []);

    const formatBytes = (bytes) => {
        if (bytes === 0) return "0 Bytes";
        const k = 1024;
        const sizes = ["Bytes", "KB", "MB", "GB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
    };

    const cancelUpload = () => {
        if (xhrRef.current) {
            xhrRef.current.abort();
        }
    };

    const detectResourceType = (file) => {
        const mime = (file.type || "").toLowerCase();
        const name = (file.name || "").toLowerCase();

        // Modelos de IA e formatos binários pesados → raw
        if (/\.(gguf|ggml|bin|pt|pth|onnx|safetensors|ckpt|pickle|pkl)$/i.test(name)) {
            return "raw";
        }

        if (mime.startsWith("image/")) return "image";
        if (mime.startsWith("video/")) return "video";
        if (mime.startsWith("audio/")) return "video";

        if (/\.(jpe?g|png|gif|webp|bmp|svg|heic|avif)$/i.test(name)) return "image";
        if (/\.(mp4|webm|mov|avi|mkv|m4v)$/i.test(name)) return "video";
        if (/\.(mp3|wav|ogg|m4a|aac|flac)$/i.test(name)) return "video";

        // PDF, ZIP, DOC, e tudo o resto → raw
        return "raw";
    };

    const uploadFileInChunks = async (file) => {
        const detectedType = detectResourceType(file);

        // 1. Pedir assinatura ao backend
        const signatureResponse = await fetchComAuth(`${urlBancoDeDados}/api/create-upload-signature`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                filename: file.name,
                file_size: file.size,
                mime_type: file.type || "application/octet-stream",
                resource_type: detectedType
            })
        });

        const signatureData = await signatureResponse.json().catch(() => ({}));

        if (!signatureResponse.ok || !signatureData.success) {
            console.error("Erro na assinatura:", signatureData);
            throw new Error(signatureData.error || "Não foi possível iniciar o upload.");
        }

        // Validar campos obrigatórios
        const required = ["api_key", "timestamp", "signature", "cloud_name", "upload_id", "public_id"];
        for (const key of required) {
            if (!signatureData[key]) {
                console.error("Assinatura incompleta. Falta:", key, signatureData);
                throw new Error(`Resposta da assinatura incompleta (falta ${key}).`);
            }
        }

        // Cloudinary exige chunks > 5MB (exceto o último)
        // Usa o do backend, mas nunca menos de 6MB
        let chunkSize = Number(signatureData.chunk_size) || 6 * 1024 * 1024;
        if (chunkSize < 5 * 1024 * 1024) {
            chunkSize = 6 * 1024 * 1024;
        }

        const resourceType = signatureData.resource_type || detectedType;
        const cloudName = signatureData.cloud_name;
        const uploadUrl = `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`;

        let uploadedBytesTotal = 0;
        let uploadResult = null;

        for (let start = 0; start < file.size; start += chunkSize) {
            const end = Math.min(start + chunkSize, file.size);
            const chunk = file.slice(start, end);

            const formData = new FormData();
            formData.append("file", chunk, file.name);
            formData.append("api_key", signatureData.api_key);
            formData.append("timestamp", String(signatureData.timestamp));
            formData.append("signature", signatureData.signature);
            formData.append("folder", signatureData.folder || "");
            formData.append("public_id", signatureData.public_id);

            // Alguns backends também assinam estes campos — envia se existirem
            if (signatureData.upload_preset) {
                formData.append("upload_preset", signatureData.upload_preset);
            }

            uploadResult = await new Promise((resolve, reject) => {
                const xhr = new XMLHttpRequest();
                xhrRef.current = xhr;

                xhr.open("POST", uploadUrl, true);
                xhr.setRequestHeader("X-Unique-Upload-Id", signatureData.upload_id);
                // Content-Range: bytes start-(end-1)/total
                xhr.setRequestHeader(
                    "Content-Range",
                    `bytes ${start}-${end - 1}/${file.size}`
                );

                xhr.upload.onprogress = (event) => {
                    if (!event.lengthComputable) return;

                    const chunkLoaded = Math.min(
                        chunk.size,
                        Math.round((event.loaded / event.total) * chunk.size)
                    );
                    const loaded = Math.min(file.size, uploadedBytesTotal + chunkLoaded);

                    setUploadedBytes(loaded);
                    setUploadProgress(Math.floor((loaded / file.size) * 100));

                    const elapsed = (Date.now() - uploadStartTimeRef.current) / 1000;
                    if (elapsed > 0.5 && loaded > 0) {
                        const speed = loaded / elapsed;
                        setUploadSpeed((speed / (1024 * 1024)).toFixed(1));
                        setTimeRemaining(Math.max(0, Math.ceil((file.size - loaded) / speed)));
                    }
                };

                xhr.onload = () => {
                    let result = {};
                    try {
                        result = JSON.parse(xhr.responseText);
                    } catch {
                        result = { raw: xhr.responseText };
                    }

                    console.log(`Chunk ${start}-${end - 1} status ${xhr.status}:`, result);

                    if (xhr.status < 200 || xhr.status >= 300 || result.error) {
                        const msg =
                            result.error?.message ||
                            result.message ||
                            `Cloudinary recusou o bloco (${xhr.status})`;
                        reject(new Error(msg));
                        return;
                    }
                    resolve(result);
                };

                xhr.onerror = () => reject(new Error("Erro de rede durante o envio de um bloco."));
                xhr.onabort = () => reject(new DOMException("Upload cancelado.", "AbortError"));

                xhr.send(formData);
            });

            uploadedBytesTotal = end;
        }

        // Aceita sucesso se tiver done:true OU se tiver public_id / secure_url
        const success =
            uploadResult?.done === true ||
            uploadResult?.public_id ||
            uploadResult?.secure_url ||
            uploadResult?.url;

        if (!success) {
            console.error("Resposta final do Cloudinary sem confirmação:", uploadResult);
            throw new Error("Cloudinary não confirmou o último bloco do arquivo.");
        }

        // 2. Finalizar no teu backend
        const finalizeResponse = await fetchComAuth(`${urlBancoDeDados}/api/finalize-chunked-upload`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                upload_ticket: signatureData.upload_ticket,
                public_id: uploadResult.public_id || signatureData.public_id,
                filename: file.name,
                mime_type: file.type || "application/octet-stream",
                // dados úteis que o Cloudinary devolve
                secure_url: uploadResult.secure_url,
                url: uploadResult.url,
                bytes: uploadResult.bytes,
                format: uploadResult.format,
                resource_type: uploadResult.resource_type || resourceType
            })
        });

        const finalData = await finalizeResponse.json().catch(() => ({}));

        if (!finalizeResponse.ok || !finalData.success) {
            console.error("Erro no finalize:", finalData);
            throw new Error(finalData.error || "O backend não confirmou o arquivo no Cloudinary.");
        }

        // Garante que devolve os campos que o handleFileSelect espera
        return {
            ...finalData,
            mime_type: finalData.mime_type || file.type || "application/octet-stream",
            filename: finalData.filename || file.name,
            size: finalData.size || uploadResult.bytes || file.size,
            file_url: finalData.file_url || uploadResult.secure_url || uploadResult.url,
            public_id: finalData.public_id || uploadResult.public_id,
            folder: finalData.folder || signatureData.folder,
            format: finalData.format || uploadResult.format,
            resource_type: finalData.resource_type || uploadResult.resource_type || resourceType
        };
    };

    const handleFileSelect = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Limpa o input logo para permitir reescolher o mesmo ficheiro
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }

        if (file.size > 1024 ** 3) {
            alert("O arquivo é muito grande.\nLimite máximo: 1GB");
            return;
        }

        if (!ChatAtivo?.nossa_sala || !ChatAtivo?.id_amigo) {
            alert("Nenhum chat ativo. Abre uma conversa primeiro.");
            return;
        }

        setIsUploading(true);
        setUploadProgress(0);
        setUploadedBytes(0);
        setUploadSpeed(0);
        setTimeRemaining(0);
        setFileInfo({ name: file.name, totalSize: file.size });
        uploadStartTimeRef.current = Date.now();

        try {
            const result = await uploadFileInChunks(file);

            const payload = JSON.stringify({
                isFile: true,
                mimeType: result.mime_type || file.type || "application/octet-stream",
                fileName: result.filename || file.name,
                fileSize: result.size || file.size,
                fileUrl: result.file_url,
                publicId: result.public_id,
                folder: result.folder,
                format: result.format,
                resourceType: result.resource_type
            });

            const tempId = "temp-file-" + Date.now();
            const optimisticMsg = {
                id: tempId,
                menssagem: payload,
                reply_to_id: replyTo?.id,
                reply_to_menssagem: replyTo?.menssagem,
                reply_to_nome: replyTo?.nome_remitente,
                blobUrl: URL.createObjectURL(file),
                id_remitente: dadosUsuario?.id,
                id_destinatario: ChatAtivo?.id_amigo,
                data_envio: new Date().toLocaleTimeString("pt-BR", {
                    hour: "2-digit",
                    minute: "2-digit"
                }),
                nossa_sala: ChatAtivo?.nossa_sala,
                lida: false,
                nome_remitente: dadosUsuario?.nome || "Você"
            };

            if (setMenssagem) setMenssagem(optimisticMsg);

            Enviar_menssagem(
                null,
                socket,
                ChatAtivo?.nossa_sala,
                ChatAtivo?.id_amigo,
                ChatAtivo?.nome_amigo,
                payload,
                dadosUsuario,
                setQuantidadeMensagemNaoLida,
                null,
                (sendResult) => {
                    if (sendResult?.success) {
                        setReplyTo(null);
                        return;
                    }
                    useUserStore.getState().elimiar_menssagem_array?.(tempId, ChatAtivo?.nossa_sala);
                    URL.revokeObjectURL(optimisticMsg.blobUrl);
                    alert(sendResult?.error || "O backend não confirmou o armazenamento do arquivo.");
                },
                replyTo
            );
        } catch (error) {
            console.error("Falha no upload:", error);
            if (error.name !== "AbortError") {
                alert(error.message || "Falha no upload do arquivo.");
            }
        } finally {
            setIsUploading(false);
            setUploadProgress(0);
            setUploadedBytes(0);
            setUploadSpeed(0);
            setTimeRemaining(0);
            setFileInfo({ name: "", totalSize: 0 });
            xhrRef.current = null;
        }
    };

    const GIPHY_KEY = "BNRiiBPysmC7ZtoZZqIQMVVvaZCgmYvR";

    const iniciarEdicao = (event, msgId) => {
        event.preventDefault();
        const mensagem = menssagens.find((item) => String(item.id) === String(msgId));
        if (!mensagem) {
            alert("Não foi possível encontrar a mensagem para editar.");
            return;
        }
        if (String(mensagem.id_remitente) !== String(dadosUsuario?.id)) {
            alert("Só pode editar as suas próprias mensagens.");
            TirarSelecao();
            setIdMenssagem(null);
            return;
        }
        if (typeof mensagem.menssagem !== "string" || mensagem.file_url) {
            alert("Só é possível editar mensagens de texto.");
            TirarSelecao();
            setIdMenssagem(null);
            return;
        }

        setEditandoID(mensagem.id);
        setReplyTo(null);
        setTexto(mensagem.menssagem);
        setMostrarPicker(false);
        setMostrarGifs(false);
        TirarSelecao();
        setIdMenssagem(null);
        inputMensagemRef.current?.focus();
    };

    const cancelarEdicao = () => {
        if (salvandoEdicao) return;
        setEditandoID(null);
        setTexto("");
    };

    const obterTextoResposta = (mensagem) => {
        const conteudo = mensagem?.menssagem;
        if (typeof conteudo !== "string") return "Mensagem";
        if (conteudo.startsWith("data:audio")) return "Mensagem de áudio";
        if (conteudo.includes("giphy.com")) return "GIF";

        try {
            const dados = JSON.parse(conteudo);
            if (dados?.isFile) return dados.fileName || "Ficheiro";
        } catch {
            // Mensagens de texto simples não são JSON.
        }

        return conteudo.slice(0, 500);
    };

    const iniciarResposta = () => {
        const mensagemOriginal = menssagens.find(
            (mensagem) => String(mensagem.id) === String(IdMenssagem?.id_menssagem)
        );
        if (!mensagemOriginal) return;

        setReplyTo({
            id: mensagemOriginal.id,
            menssagem: obterTextoResposta(mensagemOriginal),
            nome_remitente: mensagemOriginal.nome_remitente || "Utilizador"
        });
        const menu = document.querySelector(".conteinerRightMenuBottomBox");
        if (menu) menu.style.display = "none";
        TirarSelecao();
        setIdMenssagem(null);
        inputMensagemRef.current?.focus();
    };

    const tratarResultadoEnvio = (resultado) => {
        if (resultado?.success) {
            setReplyTo(null);
        } else {
            alert(resultado?.error || "Não foi possível enviar a mensagem.");
        }
    };

    const sendMenssage = (e) => {
        if (texto.trim() === "" || salvandoEdicao) return;
        if (editandoID !== null && !socket) {
            alert("A ligação ao chat não está disponível. Tente novamente.");
            return;
        }

        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        
        socket.emit("digitando", {
            id_destinatario: ChatAtivo?.id_amigo,
            id_remitente: dadosUsuario?.id,
            digitando: false
        });

        if (editandoID !== null) {
            setSalvandoEdicao(true);
            socket.timeout(10000).emit("editar_menssagem", {
                id_menssagem: editandoID,
                sala_menssagem: ChatAtivo?.nossa_sala,
                novo_conteudo: texto,
                id_remitente: dadosUsuario?.id
            }, (erro, resultado) => {
                setSalvandoEdicao(false);
                if (erro || !resultado?.success) {
                    alert(resultado?.error || "Não foi possível confirmar a edição. Verifique a ligação e tente novamente.");
                    return;
                }

                editar_menssagem_no_array?.(editandoID, texto, ChatAtivo?.nossa_sala);
                setEditandoID(null);
                setTexto("");
                setIdMenssagem(null);
            });
            return;
        } else {
            Enviar_menssagem(
                e,
                socket,
                ChatAtivo?.nossa_sala,
                ChatAtivo?.id_amigo,
                ChatAtivo?.nome_amigo,
                texto,
                dadosUsuario,
                setQuantidadeMensagemNaoLida,
                null,
                tratarResultadoEnvio,
                replyTo
            );
        }

        setTexto("");
        setMostrarPicker(false);
        setMostrarGifs(false);
    };

    // ===================== LÓGICA CORRIGIDA DE GRAVAÇÃO DE ÁUDIO =====================
    const alternarGravacao = async () => {
        if (!gravando) {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ 
                    audio: { 
                        echoCancellation: true, 
                        noiseSuppression: true 
                    } 
                });
                
                streamRef.current = stream;                    

                mediaRecorderRef.current = new MediaRecorder(stream, {
                    mimeType: 'audio/webm;codecs=opus'
                });

                chunksRef.current = [];

                mediaRecorderRef.current.ondataavailable = (e) => {
                    if (e.data.size > 0) chunksRef.current.push(e.data);
                };

                mediaRecorderRef.current.onstop = () => {
                    if (chunksRef.current.length === 0) {
                        cleanupAudio();
                        return;
                    }

                    const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
                    const reader = new FileReader();
                    
                    reader.readAsDataURL(blob);
                    reader.onloadend = () => {
                        const base64Audio = reader.result;
                        Enviar_menssagem(
                            null, 
                            socket, 
                            ChatAtivo?.nossa_sala, 
                            ChatAtivo?.id_amigo, 
                            ChatAtivo?.nome_amigo, 
                            base64Audio, 
                            dadosUsuario, 
                            setQuantidadeMensagemNaoLida,
                            null,
                            tratarResultadoEnvio,
                            replyTo
                        );
                    };

                    cleanupAudio();
                };

                mediaRecorderRef.current.start(250);
                
                setGravando(true);
                setTexto("");

            } catch (err) {
                console.error(err);
                alert("Microfone não disponível.");
            }
        } else {
            if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
                mediaRecorderRef.current.stop();
            }
            setGravando(false);
        }
    };

    const cleanupAudio = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        mediaRecorderRef.current = null;
        chunksRef.current = [];
    };

    const buscarGifsGiphy = async (query = "") => {
        const limit = 24;
        const url = query
            ? `https://api.giphy.com/v1/gifs/search?api_key=${GIPHY_KEY}&q=${encodeURIComponent(query)}&limit=${limit}&rating=g`
            : `https://api.giphy.com/v1/gifs/trending?api_key=${GIPHY_KEY}&limit=${limit}&rating=g`;
        try {
            const response = await fetch(url);
            const result = await response.json();
            setGifs(result.data || []);
        } catch (error) { console.error(error); }
    };

    useEffect(() => { if (mostrarGifs) buscarGifsGiphy(); }, [mostrarGifs]);

    const enviarGif = (urlDoGif) => {
        Enviar_menssagem(
            null,
            socket,
            ChatAtivo?.nossa_sala,
            ChatAtivo?.id_amigo,
            ChatAtivo?.nome_amigo,
            urlDoGif,
            dadosUsuario,
            null,
            null,
            tratarResultadoEnvio,
            replyTo
        );
        setMostrarGifs(false);
    };

    const aoDigitar = (e) => {
        const ultima_menssagem = document.getElementById(ChatAtivo?.nossa_sala)
        socket.emit("digitando", { id_destinatario: ChatAtivo?.id_amigo, id_remitente: dadosUsuario?.id, digitando: true , ultima_menssagem:ultima_menssagem.innerHTML });
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => {
            socket.emit("digitando", { id_destinatario: ChatAtivo?.id_amigo, id_remitente: dadosUsuario?.id, digitando: false , ultima_menssagem:ultima_menssagem.innerHTML });
        }, 3000);
    };


    const renderBotaoDireito = () => {
        if (gravando) return (
            <button onClick={alternarGravacao} className="btn-audio-stop">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="var(--text-on-primary)"><rect x="7" y="7" width="10" height="10" rx="2" /></svg>
            </button>
        );
        if (texto.trim() !== "" || editandoID !== null) return (
            <button onClick={sendMenssage} className="btn-send" disabled={salvandoEdicao}>
                {salvandoEdicao ? "..." : <Send />}
            </button>
        );
        return (
            <button onClick={alternarGravacao} className="btn-audio-start"><Audio color="var(--text-on-primary)" /></button>
        );
    };

    const inputMensagemRef = useRef(null);

    useEffect(() => {
        const input = inputMensagemRef.current;
        if (!input) return;
        input.style.height = "auto";
        input.style.height = `${Math.min(input.scrollHeight, 96)}px`;
    }, [texto]);

    useEffect(() => {
        return () => {
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
            }
        };
    }, []);

    return (
        <div className="ConteinerRightMenuBottom">

            <input
                type="file"
                ref={fileInputRef}
                accept="*/*"
                style={{ display: "none" }}
                onChange={handleFileSelect}
            />

            {/* ===================== BARRA DE PROGRESSO PROFISSIONAL ===================== */}
            {isUploading && (
                <div style={{
                    position: "absolute",
                    top: "-138px",
                    left: "50%",
                    transform: "translateX(-50%)",
                    backgroundColor: "var(--media-player-bg)",
                    color: "var(--media-player-text)",
                    padding: "22px 28px",
                    borderRadius: "24px",
                    boxShadow: "var(--shadow-lg)",
                    width: "440px",
                    zIndex: 99999,
                    fontFamily: "system-ui, -apple-system, sans-serif"
                }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "18px" }}>
                        <div style={{ fontSize: "34px", lineHeight: 1 }}>📤</div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{
                                fontSize: "15.5px",
                                fontWeight: "700",
                                letterSpacing: "-0.4px",
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis"
                            }}>
                                {fileInfo.name}
                            </div>
                            <div style={{ fontSize: "13.2px", opacity: 0.75 }}>
                                Enviando ficheiro • {formatBytes(fileInfo.totalSize)}
                            </div>
                        </div>

                        <button
                            onClick={cancelUpload}
                            style={{
                                background: "transparent",
                                border: "2px solid var(--status-danger)",
                                color: "var(--status-danger)",
                                padding: "6px 18px",
                                borderRadius: "9999px",
                                fontSize: "13.5px",
                                fontWeight: "600",
                                cursor: "pointer",
                                transition: "all 0.2s ease"
                            }}
                            onMouseOver={(e) => { e.currentTarget.style.backgroundColor = "var(--status-danger)"; e.currentTarget.style.color = "var(--text-on-primary)"; }}
                            onMouseOut={(e) => { e.currentTarget.style.backgroundColor = "transparent"; e.currentTarget.style.color = "var(--status-danger)"; }}
                        >
                            Cancelar
                        </button>
                    </div>

                    <div style={{
                        height: "11px",
                        backgroundColor: "var(--media-player-track)",
                        borderRadius: "9999px",
                        overflow: "hidden",
                        marginBottom: "12px",
                        boxShadow: "var(--shadow-inset)"
                    }}>
                        <div
                            style={{
                                width: `${uploadProgress}%`,
                                height: "100%",
                                background: "linear-gradient(90deg, var(--media-player-accent-cyan), var(--media-player-accent))",
                                transition: "width 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)",
                                boxShadow: "0 0 15px var(--media-player-accent)",
                                position: "relative"
                            }}
                        >
                            <div style={{
                                position: "absolute",
                                top: 0,
                                left: "-150%",
                                width: "40%",
                                height: "100%",
                                background: "linear-gradient(90deg, transparent, var(--highlight-sheen), transparent)",
                                animation: "shine 2s linear infinite",
                                opacity: 0.4
                            }} />
                        </div>
                    </div>

                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px", fontSize: "14px", fontWeight: "700" }}>
                        <span>{uploadProgress}%</span>
                        <span style={{ fontFamily: "SF Mono, monospace" }}>
                            {formatBytes(uploadedBytes)} / {formatBytes(fileInfo.totalSize)}
                        </span>
                    </div>

                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13.2px", opacity: 0.85 }}>
                        <span>{uploadSpeed} MB/s</span>
                        <span>
                            {timeRemaining > 60
                                ? `${Math.floor(timeRemaining / 60)} min ${Math.floor(timeRemaining % 60)} s`
                                : `${timeRemaining} s`
                            } restantes
                        </span>
                    </div>

                    <style>
                        {`
                            @keyframes shine {
                                0% { transform: translateX(-150%); }
                                100% { transform: translateX(400%); }
                            }
                        `}
                    </style>
                </div>
            )}

            <div className="conteinerRightMenuBottomBox">
                <div className="conteinerRightMenuBottomBoxCont">
                    <li onClick={(e) => Eliminar_menssagem(e, IdMenssagem, socket)}>
                       <Erro /> <b>Eliminar</b>
                    </li>
                    <li onClick={(e) => iniciarEdicao(e, IdMenssagem.id_menssagem)}>
                       <Editar />  <b>Editar</b>
                    </li>
                    <li><Reencaminhar /><b>Reencaminhar</b></li>
                    <li onClick={iniciarResposta}><Responder /> <b>Responder</b> </li>
                    <li><Denunciar /> <b>Denunciar</b> </li>
                </div>
            </div>

            {mostrarPicker && (
                <div 
                    className="emoji-picker-container"
                    style={{
                        position: "absolute",
                        bottom: "100%",
                        left: "12px",           
                        zIndex: 10000,
                        backgroundColor: "var(--chat-theme-composer-bg, var(--surface))",
                        color: "var(--chat-theme-foreground, var(--text-primary))",
                        borderRadius: "16px",
                        boxShadow: "var(--shadow-md)",
                        padding: "10px",
                        marginBottom: "12px",
                        width: "320px",
                        maxHeight: "420px",
                        overflow: "hidden",
                        border: "1px solid var(--border)"
                    }}
                >
                    <div className="composer-panel-header">
                        <strong>Emojis</strong>
                        <button
                            type="button"
                            className="composer-panel-close"
                            aria-label="Fechar emojis"
                            onClick={() => setMostrarPicker(false)}
                        >
                            <svg viewBox="0 0 24 24" aria-hidden="true">
                                <path d="M18 6 6 18M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                    <EmojiPicker 
                        onEmojiClick={(emojiData) => setTexto(prev => prev + emojiData.emoji)} 
                        theme={temaEscuro ? EmojiTheme.DARK : EmojiTheme.LIGHT}
                        width="100%"
                        height="360px"
                    />
                </div>
            )}

            {mostrarMenuMedia && (
                <div className="composer-media-menu" role="menu" aria-label="Escolher emoji ou GIF">
                    <button
                        type="button"
                        role="menuitem"
                        onClick={() => {
                            setMostrarPicker(true);
                            setMostrarGifs(false);
                            setMostrarMenuMedia(false);
                        }}
                    >
                        <Imoge />
                        <span>Emoji</span>
                    </button>
                    <button
                        type="button"
                        role="menuitem"
                        onClick={() => {
                            setMostrarGifs(true);
                            setMostrarPicker(false);
                            setMostrarMenuMedia(false);
                        }}
                    >
                        <span className="composer-gif-icon" aria-hidden="true">GIF</span>
                        <span>GIF</span>
                    </button>
                </div>
            )}

            {mostrarGifs && (
                <div
                    className="gifs-container"
                    style={{
                        position: "absolute",
                        bottom: "calc(100% + 12px)",
                        left: "12px",
                        zIndex: 10000,
                        backgroundColor: "var(--chat-theme-composer-bg, var(--surface))",
                        color: "var(--chat-theme-foreground, var(--text-primary))",
                        borderRadius: "16px",
                        boxShadow: "var(--shadow-md)",
                        padding: "14px",
                        width: "380px",
                        maxWidth: "calc(100vw - 24px)",
                        maxHeight: "420px",
                        border: "1px solid var(--border)",
                        display: "flex",
                        flexDirection: "column",
                        animation: "slideUp 0.2s ease-out"
                    }}
                >
                    <style>
                        {`
                            @keyframes slideUp {
                                from { opacity: 0; transform: translateY(8px); }
                                to { opacity: 1; transform: translateY(0); }
                            }
                        `}
                    </style>

                    <div className="composer-panel-header">
                        <strong>GIFs</strong>
                        <button
                            type="button"
                            className="composer-panel-close"
                            aria-label="Fechar GIFs"
                            onClick={() => setMostrarGifs(false)}
                        >
                            <svg viewBox="0 0 24 24" aria-hidden="true">
                                <path d="M18 6 6 18M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                    <input
                        type="text"
                        placeholder="Pesquisar GIF..."
                        onChange={(e) => buscarGifsGiphy(e.target.value)}
                        style={{
                            width: "100%",
                            padding: "10px 14px",
                            borderRadius: "10px",
                            border: "1px solid var(--border)",
                            marginBottom: "12px",
                            fontSize: "14px",
                            outline: "none",
                            background: "var(--chat-theme-input-bg, var(--surface-2))",
                            color: "var(--chat-theme-input-text, var(--text-primary))",
                            transition: "all 0.2s",
                            boxSizing: "border-box"
                        }}
                        onFocus={(e) => {
                            e.currentTarget.style.borderColor = "var(--primary)";
                            e.currentTarget.style.background = "var(--chat-theme-input-bg, var(--surface))";
                            e.currentTarget.style.boxShadow = "var(--shadow-teal)";
                        }}
                        onBlur={(e) => {
                            e.currentTarget.style.borderColor = "var(--border)";
                            e.currentTarget.style.background = "var(--chat-theme-input-bg, var(--surface-2))";
                            e.currentTarget.style.boxShadow = "none";
                        }}
                    />
                    <div
                        className="gifs-grid"
                        style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(auto-fill, minmax(90px, 1fr))",
                            gap: "8px",
                            overflowY: "auto",
                            maxHeight: "320px",
                            paddingRight: "4px"
                        }}
                    >
                        {gifs.map((gif) => (
                            <img
                                key={gif.id}
                                src={gif.images.fixed_height_small.url}
                                onClick={() => enviarGif(gif.images.fixed_height.url)}
                                alt="gif"
                                style={{
                                    width: "100%",
                                    aspectRatio: "1",
                                    objectFit: "cover",
                                    borderRadius: "8px",
                                    cursor: "pointer",
                                    background: "var(--surface-hover)",
                                    transition: "transform 0.15s ease, box-shadow 0.15s ease"
                                }}
                                onMouseOver={(e) => {
                                    e.currentTarget.style.transform = "scale(1.05)";
                                    e.currentTarget.style.boxShadow = "var(--shadow-md)";
                                }}
                                onMouseOut={(e) => {
                                    e.currentTarget.style.transform = "scale(1)";
                                    e.currentTarget.style.boxShadow = "none";
                                }}
                            />
                        ))}
                    </div>
                </div>
            )}
            <div className="composer-box">
                <div className="ConteinerRightMenuBottomCaxa1">
                    <button
                        type="button"
                        aria-label="Anexar ficheiro"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploading}
                    >
                        <Arquivo />
                    </button>
                    <button
                        type="button"
                        className="composer-media-toggle"
                        aria-label="Abrir opções de emoji e GIF"
                        aria-expanded={mostrarMenuMedia}
                        onClick={() => setMostrarMenuMedia((aberto) => !aberto)}
                    >
                        <Imoge />
                        <span className="composer-gif-icon" aria-hidden="true">GIF</span>
                    </button>
                </div>
                <div className="ConteinerRigtMenuBottomBoxsTop">
                    {replyTo && (
                        <div className="mensagem-resposta-ativa">
                            <div>
                                <strong>A responder a {replyTo.nome_remitente}</strong>
                                <span>{replyTo.menssagem}</span>
                            </div>
                            <button
                                type="button"
                                aria-label="Cancelar resposta"
                                onClick={() => setReplyTo(null)}
                            >
                                ×
                            </button>
                        </div>
                    )}
                    <div className="ConteinerRightMenuBottomCaxa2">
                        <textarea
                            ref={inputMensagemRef}
                            rows={1}
                            className={editandoID ? "input-editando" : ""}
                            placeholder={
                                gravando ? "🔴 Gravando..." :
                                editandoID ? "Editando mensagem (Esc para cancelar)..." : "Mensagem..."
                            }
                            value={texto}
                            onChange={(e) => { setTexto(e.target.value); aoDigitar(e); }}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    sendMenssage(e);
                                }
                                if (e.key === 'Escape') {
                                    if (replyTo) setReplyTo(null);
                                    else cancelarEdicao();
                                }
                            }}
                            disabled={gravando || isUploading || salvandoEdicao}
                        />
                        {editandoID !== null && (
                            <small className="cancel-label" onClick={cancelarEdicao}>
                                {salvandoEdicao ? "A guardar..." : "Cancelar Edição"}
                            </small>
                        )}
                    </div>
                </div>
                <div className="ConteinerRightMenuBottomCaxa3">
                    {renderBotaoDireito()}
                </div>
            </div>

        </div>
    );
}