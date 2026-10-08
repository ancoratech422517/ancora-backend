import { useState, useEffect, useRef } from "react";
import "./css/ConteinerRightMenuBottom.css";
import Arquivo from "../../components/conteinerSvg/arquivo";
import Imoge from "../../components/conteinerSvg/imoge";
import Send from "../../components/conteinerSvg/send";
import { useUserStore } from "../../../useUseSotore";
import { Enviar_menssagem } from "../../../service/socket_service_enviar_menssagem";
import EmojiPicker from 'emoji-picker-react';
import Erro from "../../components/conteinerSvg/erro";
import Audio from "../../components/conteinerSvg/audio";
import Editar from "../../components/conteinerSvg/editar";
import Reencaminhar from "../../components/conteinerSvg/reencaminhar";
import Responder from "../../components/conteinerSvg/responder";
import Denunciar from "../../components/conteinerSvg/denunciar";
import { Eliminar_menssagem } from "./js/eliminar_menssagem";

export default function ConteinerRightMenuBottom() {
    const { 
        ChatAtivo, 
        socket, 
        dadosUsuario, 
        setQuantidadeMensagemNaoLida, 
        menssagens, 
        editar_menssagem_no_array, 
        setMenssagem , 
        urlBancoDeDados 
    } = useUserStore();
    const { IdMenssagem } = useUserStore();
    
    const [texto, setTexto] = useState("");
    const [editandoID, setEditandoID] = useState(null);

    const [mostrarPicker, setMostrarPicker] = useState(false);
    const [mostrarGifs, setMostrarGifs] = useState(false);
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

    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (file.size > 2048 * 1024 * 1024) {
            alert("O arquivo é muito grande.\nLimite máximo: 1GB");
            return;
        }

        setIsUploading(true);
        setUploadProgress(0);
        setUploadedBytes(0);
        setUploadSpeed(0);
        setTimeRemaining(0);
        setFileInfo({ name: file.name, totalSize: file.size });

        uploadStartTimeRef.current = Date.now();

        const formData = new FormData();
        formData.append("file", file);

        const xhr = new XMLHttpRequest();
        xhrRef.current = xhr;

        xhr.open("POST", `${urlBancoDeDados}/api/upload-file`, true);

        xhr.upload.onprogress = (event) => {
            if (event.lengthComputable) {
                const percent = Math.round((event.loaded / event.total) * 100);
                
                setUploadProgress(percent);
                setUploadedBytes(event.loaded);

                const elapsed = (Date.now() - uploadStartTimeRef.current) / 1000;

                if (elapsed > 0.8) {
                    const speedBytesPerSecond = event.loaded / elapsed;
                    const speedMBps = (speedBytesPerSecond / (1024 * 1024)).toFixed(1);
                    setUploadSpeed(speedMBps);

                    const remainingBytes = event.total - event.loaded;
                    const remainingSeconds = remainingBytes / speedBytesPerSecond;
                    setTimeRemaining(Math.max(0, Math.ceil(remainingSeconds)));
                }
            }
        };

        xhr.onload = () => {
            if (xhr.status === 200) {
                let result;
                try {
                    result = JSON.parse(xhr.responseText);
                } catch (_) {
                    result = { success: false };
                }

                if (result.success) {
                    // ===================== LÓGICA CORRIGIDA =====================
                    const payloadObj = {
                        isFile: true,
                        mimeType: file.type || "application/octet-stream",
                        fileName: result.filename,           // Nome original (igual ao backend)
                        fileSize: file.size,
                        fileUrl: result.file_url,            // ← URL real do Cloudinary
                        publicId: result.public_id,          // ← Importante para futuro
                        folder: result.folder,
                        format: result.format,
                        resourceType: result.resource_type
                    };

                    const payload = JSON.stringify(payloadObj);
                    const tempId = "temp-file-" + Date.now();
                   
                    const optimisticMsg = {
                        id: tempId,
                        menssagem: payload,
                        blobUrl: URL.createObjectURL(file),
                        id_remitente: dadosUsuario?.id,
                        id_destinatario: ChatAtivo?.id_amigo,
                        data_envio: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
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
                        setQuantidadeMensagemNaoLida
                    );
                 
                } else {
                    alert("Erro no servidor: " + (result.error || "Desconhecido"));
                }
            } else {
                alert("Falha no upload: " + xhr.status);
            }
            cleanup();
        };

        xhr.onerror = () => {
            alert("Erro de conexão durante o envio.");
            cleanup();
        };

        xhr.onabort = () => {
            console.log("✅ Upload cancelado pelo utilizador");
            cleanup();
        };

        xhr.send(formData);
    };

    const cleanup = () => {
        setIsUploading(false);
        setUploadProgress(0);
        setUploadedBytes(0);
        setUploadSpeed(0);
        setTimeRemaining(0);
        xhrRef.current = null;
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const GIPHY_KEY = "BNRiiBPysmC7ZtoZZqIQMVVvaZCgmYvR";

    const iniciarEdicao = (e, msgId) => {
        e.preventDefault();
        const msgParaEditar = menssagens.find(m => m.id === msgId);
        const tirar_menu = document.querySelector(".conteinerRightMenuBottomBox")
        if (tirar_menu){
            tirar_menu.style.display = "none"
        }
        
        if (msgParaEditar) {
            setEditandoID(msgId);
            setTexto(msgParaEditar.menssagem); 
            setMostrarPicker(false);
            setMostrarGifs(false);
        }
    };

    const cancelarEdicao = () => {
        setEditandoID(null);
        setTexto("");
    };

    const sendMenssage = (e) => {
        if (texto.trim() === "") return;

        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        
        socket.emit("digitando", {
            id_destinatario: ChatAtivo?.id_amigo,
            id_remitente: dadosUsuario?.id,
            digitando: false
        });

        if (editandoID) {
            if (editar_menssagem_no_array) {
                editar_menssagem_no_array(editandoID, texto);
            }

            const elementoVisual = document.getElementById(editandoID);
            if (elementoVisual && elementoVisual.classList.contains("textoUserMim")) {
                elementoVisual.innerText = texto;
            } else {
                const todosTextoUser = document.querySelectorAll(".textoUserMim");
                todosTextoUser.forEach(el => {
                    if (el.innerText === menssagens.find(m => m.id === editandoID)?.menssagem) {
                        el.innerText = texto;
                    }
                });
            }

            socket.emit("editar_menssagem", {
                id_menssagem: editandoID,
                sala_menssagem: ChatAtivo?.nossa_sala,
                novo_conteudo: texto,
                id_remitente: dadosUsuario?.id
            });
            const dados = document.querySelectorAll(".ConteinerRightDadosWindowMenssageMim")
                dados.forEach((dados) =>{
                    dados.classList.remove("ativar_selecao_menssagem")
                })

            setEditandoID(null); 
        } else {
            Enviar_menssagem(e, socket, ChatAtivo?.nossa_sala, ChatAtivo?.id_amigo, ChatAtivo?.nome_amigo, texto, dadosUsuario, setQuantidadeMensagemNaoLida);
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
                            setQuantidadeMensagemNaoLida
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
        Enviar_menssagem(null, socket, ChatAtivo?.nossa_sala, ChatAtivo?.id_amigo, ChatAtivo?.nome_amigo, urlDoGif, dadosUsuario);
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
                <svg width="24" height="24" viewBox="0 0 24 24" fill="#fff"><rect x="7" y="7" width="10" height="10" rx="2" /></svg>
            </button>
        );
        if (texto.trim() !== "" || editandoID) return (
            <button onClick={sendMenssage} className="btn-send"><Send /></button>
        );
        return (
            <button onClick={alternarGravacao} className="btn-audio-start"><Audio color="white" /></button>
        );
    };

    const textareaRef = useRef(null);
    const adjustTextareaHeight = () => {
        const textarea = textareaRef.current;
        if (!textarea) return;
        textarea.style.height = 'auto'; 
        const maxHeightPx = parseFloat(getComputedStyle(textarea).maxHeight) || Infinity;
        const newHeight = Math.min(textarea.scrollHeight, maxHeightPx);
        textarea.style.height = `${newHeight}px`;
    };

    useEffect(() => {
        adjustTextareaHeight();
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
                    backgroundColor: "#0f172a",
                    color: "#fff",
                    padding: "22px 28px",
                    borderRadius: "24px",
                    boxShadow: "0 25px 50px -12px rgb(15 23 42)",
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
                                border: "2px solid #f87171",
                                color: "#f87171",
                                padding: "6px 18px",
                                borderRadius: "9999px",
                                fontSize: "13.5px",
                                fontWeight: "600",
                                cursor: "pointer",
                                transition: "all 0.2s ease"
                            }}
                            onMouseOver={(e) => { e.currentTarget.style.backgroundColor = "#f87171"; e.currentTarget.style.color = "#fff"; }}
                            onMouseOut={(e) => { e.currentTarget.style.backgroundColor = "transparent"; e.currentTarget.style.color = "#f87171"; }}
                        >
                            Cancelar
                        </button>
                    </div>

                    <div style={{
                        height: "11px",
                        backgroundColor: "#1e2937",
                        borderRadius: "9999px",
                        overflow: "hidden",
                        marginBottom: "12px",
                        boxShadow: "inset 0 1px 3px rgba(0,0,0,0.3)"
                    }}>
                        <div
                            style={{
                                width: `${uploadProgress}%`,
                                height: "100%",
                                background: "linear-gradient(90deg, #00d4ff, #22ffaa)",
                                transition: "width 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)",
                                boxShadow: "0 0 15px #22ffaa",
                                position: "relative"
                            }}
                        >
                            <div style={{
                                position: "absolute",
                                top: 0,
                                left: "-150%",
                                width: "40%",
                                height: "100%",
                                background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.6), transparent)",
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
                        <b>Eliminar</b> <Erro />
                    </li>
                    <li onClick={(e) => iniciarEdicao(e, IdMenssagem.id_menssagem)}>
                        <b>Editar</b> <Editar />
                    </li>
                    <li><b>Reencaminhar</b> <Reencaminhar /></li>
                    <li><b>Responder</b> <Responder /></li>
                    <li><b>Denunciar</b> <Denunciar /></li>
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
                        backgroundColor: "#ffffff",
                        borderRadius: "16px",
                        boxShadow: "0 10px 30px rgba(0, 0, 0, 0.18)",
                        padding: "10px",
                        marginBottom: "12px",
                        width: "320px",
                        maxHeight: "420px",
                        overflow: "hidden",
                        border: "1px solid #e5e5e5"
                    }}
                >
                    <EmojiPicker 
                        onEmojiClick={(emojiData) => setTexto(prev => prev + emojiData.emoji)} 
                        width="100%"
                        height="400px"
                    />
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
                        backgroundColor: "#ffffff",
                        borderRadius: "16px",
                        boxShadow: "0 12px 32px rgba(15, 23, 42, 0.18)",
                        padding: "14px",
                        width: "380px",
                        maxWidth: "calc(100vw - 24px)",
                        maxHeight: "420px",
                        border: "1px solid #e5e7eb",
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

                    <input
                        type="text"
                        placeholder="Pesquisar GIF..."
                        onChange={(e) => buscarGifsGiphy(e.target.value)}
                        style={{
                            width: "100%",
                            padding: "10px 14px",
                            borderRadius: "10px",
                            border: "1px solid #e5e7eb",
                            marginBottom: "12px",
                            fontSize: "14px",
                            outline: "none",
                            background: "#f9fafb",
                            transition: "all 0.2s",
                            boxSizing: "border-box"
                        }}
                        onFocus={(e) => {
                            e.currentTarget.style.borderColor = "#6366f1";
                            e.currentTarget.style.background = "#fff";
                            e.currentTarget.style.boxShadow = "0 0 0 3px rgba(99, 102, 241, 0.1)";
                        }}
                        onBlur={(e) => {
                            e.currentTarget.style.borderColor = "#e5e7eb";
                            e.currentTarget.style.background = "#f9fafb";
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
                                    background: "#f1f5f9",
                                    transition: "transform 0.15s ease, box-shadow 0.15s ease"
                                }}
                                onMouseOver={(e) => {
                                    e.currentTarget.style.transform = "scale(1.05)";
                                    e.currentTarget.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.15)";
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
            <div className="ConteinerRightMenuBottomCaxa1">
                    <button onClick={() => fileInputRef.current?.click()} disabled={isUploading}>
                        <Arquivo />
                    </button>
                    <button onClick={() => { setMostrarPicker(!mostrarPicker); setMostrarGifs(false); }}><Imoge /></button>
                    <button onClick={() => { setMostrarGifs(!mostrarGifs); setMostrarPicker(false); }}>GIF</button>
            </div>
            <div className="ConteinerRigtMenuBottomBoxsTop">
                <div className="ConteinerRightMenuBottomCaxa2">
                    <textarea
                        ref={textareaRef}
                        type="text"
                        className={editandoID ? "input-editando" : ""}
                        placeholder={
                            gravando ? "🔴 Gravando..." : 
                            editandoID ? "Editando mensagem (Esc para cancelar)..." : "Menssagem..."
                        }
                        value={texto}
                        onChange={(e) => { setTexto(e.target.value); aoDigitar(e); }}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') sendMenssage(e);
                            if (e.key === 'Escape') cancelarEdicao();
                        }}
                        disabled={gravando || isUploading}
                    />
                    {editandoID && <small className="cancel-label" onClick={cancelarEdicao}>Cancelar Edição</small>}
                </div>
            </div>
            <div className="ConteinerRightMenuBottomCaxa3">
                    {renderBotaoDireito()}
            </div>

            {/* <div className="ConteinerRigtMenuBottomBoxsBottom">
                <div className="ConteinerRightMenuBottomCaxa1">
                    <button onClick={() => fileInputRef.current?.click()} disabled={isUploading}>
                        <Arquivo />
                    </button>
                    <button onClick={() => { setMostrarPicker(!mostrarPicker); setMostrarGifs(false); }}><Imoge /></button>
                    <button onClick={() => { setMostrarGifs(!mostrarGifs); setMostrarPicker(false); }}>GIF</button>
                </div>

                <div className="ConteinerRightMenuBottomCaxa3">
                    {renderBotaoDireito()}
                </div>
            </div> */}

        </div>
    );
}