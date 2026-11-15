import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { fetchComAuth } from "../../utils/api";
import { useUserStore } from "../../useUseSotore";
import { ASSISTANT_VOICE_STYLES } from "./assistantVoiceStyles";
import { ASSISTANT_CHAT_ID, ASSISTANT_CHAT_TYPE } from "./assistantConfig";
import {
  ANIMATED_CHAT_SCENES,
} from "../conteiner1/conteinerRight/animatedChatScenes";
import {
  CHAT_THEMES,
  DEFAULT_CHAT_THEME,
} from "../conteiner1/conteinerRight/chatThemes";
import { saveTheme } from "../../utils/theme";
import "./assistantChat.css";

const QUICK_PROMPTS = [
  "Como registo um produto?",
  "Como crio uma publicação?",
  "Como uso o CRM?",
];

const ASSISTANT_VOICES = [
  { id: "pt-PT-RaquelNeural", name: "Raquel", gender: "Feminina", locale: "Português (Portugal)" },
  { id: "pt-PT-DuarteNeural", name: "Duarte", gender: "Masculina", locale: "Português (Portugal)" },
  { id: "pt-BR-FranciscaNeural", name: "Francisca", gender: "Feminina", locale: "Português (Brasil)" },
  { id: "pt-BR-AntonioNeural", name: "António", gender: "Masculina", locale: "Português (Brasil)" },
];
const DEFAULT_ASSISTANT_VOICE = ASSISTANT_VOICES[0].id;

function createMessageId() {
  return `assistant-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function prepareSpeechText(text) {
  return String(text)
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/https?:\/\/\S+|www\.\S+/g, " ")
    .replace(/^\s{0,3}#{1,6}\s*/gm, "")
    .replace(/^\s*(?:[-*+•]|\d+[.)]|>)\s+/gm, "")
    .replace(/&amp;/gi, "&")
    .replace(/&nbsp;/gi, " ")
    .replace(/&lt;/gi, " menor que ")
    .replace(/&gt;/gi, " maior que ")
    .replace(/&quot;|&#39;/gi, " ")
    .replace(/&/g, " e ")
    .replace(/%/g, " por cento ")
    .replace(/\$/g, " dólares ")
    .replace(/€/g, " euros ")
    .replace(/£/g, " libras ")
    .replace(/_/g, " ")
    .replace(/[^\p{L}\p{N}\s.,;:!?+'’-]/gu, " ")
    .replace(/\s+([,.;:!?])/g, "$1")
    .replace(/([,.;:!?])(?=\S)/g, "$1 ")
    .replace(/\s+/g, " ")
    .trim();
}

function getSavedAssistantVoice() {
  try {
    const savedVoice = localStorage.getItem("ancora-assistant-voice");
    return ASSISTANT_VOICES.some((voice) => voice.id === savedVoice)
      ? savedVoice
      : DEFAULT_ASSISTANT_VOICE;
  } catch (error) {
    console.warn("Não foi possível carregar a voz do assistente:", error);
    return DEFAULT_ASSISTANT_VOICE;
  }
}

function getSavedVoiceStyle() {
  try {
    const saved = Number(localStorage.getItem("ancora-assistant-voice-style"));
    return Number.isInteger(saved) && saved >= 0 && saved < ASSISTANT_VOICE_STYLES.length
      ? saved
      : 0;
  } catch (error) {
    console.warn("Não foi possível carregar o estilo de voz do assistente:", error);
    return 0;
  }
}

function createChatMessage(role, content, chat, user) {
  const isAssistant = role === "assistant";
  return {
    id: createMessageId(),
    nossa_sala: chat.nossa_sala,
    id_remitente: isAssistant ? ASSISTANT_CHAT_ID : user.id,
    id_destinatario: isAssistant ? user.id : ASSISTANT_CHAT_ID,
    nome_remitente: isAssistant ? chat.nome_amigo : user.nome,
    foto_usuario: isAssistant ? "none" : user.foto_usuario,
    menssagem: content,
    data_envio: new Date().toLocaleTimeString("pt-PT", {
      hour: "2-digit",
      minute: "2-digit",
    }),
    timestamp: Date.now(),
    lida: true,
  };
}

function waitForSourceOpen(mediaSource, signal) {
  if (mediaSource.readyState === "open") return Promise.resolve();
  return new Promise((resolve, reject) => {
    const cleanup = () => {
      mediaSource.removeEventListener("sourceopen", handleOpen);
      signal.removeEventListener("abort", handleAbort);
    };
    const handleOpen = () => {
      cleanup();
      resolve();
    };
    const handleAbort = () => {
      cleanup();
      reject(new DOMException("Audio stream cancelled", "AbortError"));
    };
    mediaSource.addEventListener("sourceopen", handleOpen, { once: true });
    signal.addEventListener("abort", handleAbort, { once: true });
  });
}

function appendAudioChunk(sourceBuffer, chunk, signal) {
  return new Promise((resolve, reject) => {
    const cleanup = () => {
      sourceBuffer.removeEventListener("updateend", handleUpdateEnd);
      sourceBuffer.removeEventListener("error", handleError);
      signal.removeEventListener("abort", handleAbort);
    };
    const handleUpdateEnd = () => {
      cleanup();
      resolve();
    };
    const handleError = () => {
      cleanup();
      reject(new Error("O navegador não conseguiu processar o áudio recebido."));
    };
    const handleAbort = () => {
      cleanup();
      reject(new DOMException("Audio stream cancelled", "AbortError"));
    };
    sourceBuffer.addEventListener("updateend", handleUpdateEnd, { once: true });
    sourceBuffer.addEventListener("error", handleError, { once: true });
    signal.addEventListener("abort", handleAbort, { once: true });
    try {
      sourceBuffer.appendBuffer(chunk);
    } catch (appendError) {
      cleanup();
      reject(appendError);
    }
  });
}

export default function AssistantChat() {
  const backendUrl = useUserStore((state) => state.urlBancoDeDados);
  const activeChat = useUserStore((state) => state.ChatAtivo);
  const user = useUserStore((state) => state.dadosUsuario);
  const messages = useUserStore((state) => state.menssagens);
  const setMenssagem = useUserStore((state) => state.setMenssagem);
  const assistantAudioMode = useUserStore((state) => state.assistantAudioMode);
  const setAssistantAudioMode = useUserStore((state) => state.setAssistantAudioMode);
  const setAssistantAudioActivity = useUserStore((state) => state.setAssistantAudioActivity);
  const setChatThemeId = useUserStore((state) => state.setChatThemeId);
  const setChatAnimatedSceneId = useUserStore((state) => state.setChatAnimatedSceneId);
  const [draft, setDraft] = useState("");
  const mode = assistantAudioMode ? "audio" : "text";
  const [assistantVoiceId, setAssistantVoiceId] = useState(getSavedAssistantVoice);
  const [voicePickerOpen, setVoicePickerOpen] = useState(false);
  const [voiceStyle, setVoiceStyle] = useState(getSavedVoiceStyle);
  const [isSending, setIsSending] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState("");
  const [pendingAction, setPendingAction] = useState(null);
  const [isExecutingAction, setIsExecutingAction] = useState(false);
  const recognitionRef = useRef(null);
  const audioRef = useRef(null);
  const audioUrlRef = useRef(null);
  const speechControllerRef = useRef(null);
  const audioPulseIntervalRef = useRef(null);
  const browserSpeechRef = useRef(null);
  const voicePulseRef = useRef(0);
  const voicePickerRef = useRef(null);
  const SpeechRecognitionAPI = useMemo(
    () => typeof window === "undefined"
      ? null
      : window.SpeechRecognition || window.webkitSpeechRecognition || null,
    [],
  );
  const assistantMessages = messages.filter(
    (message) => String(message.nossa_sala) === String(activeChat?.nossa_sala),
  );
  const pulseVoiceSphere = useCallback(() => {
    voicePulseRef.current += 1;
    setAssistantAudioActivity({ pulse: voicePulseRef.current });
  }, [setAssistantAudioActivity]);

  useEffect(() => {
    try {
      localStorage.setItem("ancora-assistant-voice", assistantVoiceId);
    } catch (storageError) {
      console.warn("Não foi possível guardar a voz do assistente:", storageError);
    }
  }, [assistantVoiceId]);

  useEffect(() => {
    try {
      localStorage.setItem("ancora-assistant-voice-style", String(voiceStyle));
    } catch (storageError) {
      console.warn("Não foi possível guardar o estilo de voz do assistente:", storageError);
    }
    setAssistantAudioActivity({ styleIndex: voiceStyle });
  }, [setAssistantAudioActivity, voiceStyle]);

  useEffect(() => {
    if (!voicePickerOpen) return undefined;
    const handlePointerDown = (event) => {
      if (!voicePickerRef.current?.contains(event.target)) setVoicePickerOpen(false);
    };
    const handleKeyDown = (event) => {
      if (event.key === "Escape") setVoicePickerOpen(false);
    };
    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [voicePickerOpen]);

  const stopSpeech = useCallback((updateState = true) => {
    speechControllerRef.current?.abort("cancelled");
    speechControllerRef.current = null;
    if (browserSpeechRef.current) {
      window.speechSynthesis?.cancel();
      browserSpeechRef.current = null;
    }
    if (audioPulseIntervalRef.current) {
      window.clearInterval(audioPulseIntervalRef.current);
      audioPulseIntervalRef.current = null;
    }
    if (audioRef.current) {
      audioRef.current.onended = null;
      audioRef.current.onerror = null;
      audioRef.current.pause();
      audioRef.current.removeAttribute("src");
      audioRef.current.load();
      audioRef.current = null;
    }
    if (audioUrlRef.current) {
      URL.revokeObjectURL(audioUrlRef.current);
      audioUrlRef.current = null;
    }
    if (updateState) {
      setIsSpeaking(false);
      setAssistantAudioActivity({ speaking: false });
    } else {
      setAssistantAudioActivity({ speaking: false });
    }
  }, [setAssistantAudioActivity]);

  useEffect(() => () => {
    recognitionRef.current?.stop();
    stopSpeech(false);
  }, [stopSpeech]);

  const speak = useCallback(async (text) => {
    stopSpeech();
    setError("");
    setIsSpeaking(true);
    setAssistantAudioActivity({ speaking: true });

    if (
      typeof window !== "undefined"
      && window.speechSynthesis
      && typeof window.SpeechSynthesisUtterance === "function"
    ) {
      const utterance = new window.SpeechSynthesisUtterance(text);
      utterance.rate = 1.1;
      const voiceParts = assistantVoiceId.split("-");
      const locale = `${voiceParts[0]}-${voiceParts[1]}`;
      const preferredName = voiceParts[2]?.replace("Neural", "").toLowerCase();
      const availableVoices = window.speechSynthesis.getVoices();
      const selectedVoice = availableVoices.find(
        (voice) => preferredName && voice.name.toLowerCase().includes(preferredName),
      ) || availableVoices.find(
        (voice) => voice.lang.toLowerCase().startsWith(locale.toLowerCase()),
      );
      utterance.lang = locale;
      if (selectedVoice) utterance.voice = selectedVoice;
      utterance.onstart = () => {
        setIsSpeaking(true);
        setAssistantAudioActivity({ speaking: true });
      };
      utterance.onboundary = (event) => {
        if (event.name === "word") pulseVoiceSphere();
      };
      utterance.onend = () => {
        browserSpeechRef.current = null;
        setIsSpeaking(false);
        setAssistantAudioActivity({ speaking: false });
      };
      utterance.onerror = (event) => {
        browserSpeechRef.current = null;
        setIsSpeaking(false);
        setAssistantAudioActivity({ speaking: false });
        if (event.error !== "canceled" && event.error !== "interrupted") {
          setError("Não foi possível reproduzir a resposta em áudio.");
        }
      };
      browserSpeechRef.current = utterance;
      window.speechSynthesis.speak(utterance);
      return;
    }

    const controller = new AbortController();
    speechControllerRef.current = controller;
    const timeoutId = window.setTimeout(() => controller.abort("timeout"), 45000);

    try {
      const base = String(backendUrl || "").replace(/\/+$/, "");
      if (!base) throw new Error("O endereço do backend não está configurado.");

      const response = await fetchComAuth(`${base}/api/assistente-ia/speech`, {
        method: "POST",
        body: JSON.stringify({ text, voice: assistantVoiceId }),
        signal: controller.signal,
        offlineQueue: false,
      });
      if (!response.ok) {
        const responseText = await response.text();
        let data = null;
        try {
          data = responseText ? JSON.parse(responseText) : null;
        } catch {
          data = null;
        }
        if (response.status === 404) {
          throw new Error("A rota de voz não está disponível no backend publicado. Atualiza o backend no Render.");
        }
        throw new Error(data?.error || `Não foi possível gerar o áudio (${response.status}).`);
      }

      const audio = new Audio();
      audioRef.current = audio;
      audio.preload = "auto";
      audio.onplaying = () => {
        setIsSpeaking(true);
        setAssistantAudioActivity({ speaking: true });
        if (audioPulseIntervalRef.current) window.clearInterval(audioPulseIntervalRef.current);
        audioPulseIntervalRef.current = window.setInterval(
          pulseVoiceSphere,
          160,
        );
      };
      audio.onended = () => stopSpeech();
      audio.onerror = () => {
        stopSpeech();
        setError("Não foi possível reproduzir a resposta em áudio.");
      };
      const canStreamAudio = response.body
        && typeof response.body.getReader === "function"
        && typeof MediaSource !== "undefined"
        && MediaSource.isTypeSupported("audio/mpeg");
      if (canStreamAudio) {
        const mediaSource = new MediaSource();
        const audioUrl = URL.createObjectURL(mediaSource);
        audioUrlRef.current = audioUrl;
        const sourceOpen = waitForSourceOpen(mediaSource, controller.signal);
        audio.src = audioUrl;
        await sourceOpen;
        const sourceBuffer = mediaSource.addSourceBuffer("audio/mpeg");
        let playbackRequested = false;
        audio.oncanplay = () => {
          if (playbackRequested) return;
          playbackRequested = true;
          audio.play().catch(() => {
            if (controller.signal.aborted) return;
            stopSpeech();
            setError("Não foi possível reproduzir a resposta em áudio.");
          });
        };
        const reader = response.body.getReader();
        let receivedAudio = false;
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          if (!value?.byteLength) continue;
          await appendAudioChunk(sourceBuffer, value, controller.signal);
          receivedAudio = true;
        }
        if (!receivedAudio) throw new Error("O serviço de voz devolveu um áudio vazio.");
        if (mediaSource.readyState === "open") mediaSource.endOfStream();
      } else {
        const audioBlob = await response.blob();
        if (!audioBlob.size || !audioBlob.type.startsWith("audio/")) {
          throw new Error("O serviço de voz devolveu um áudio inválido.");
        }
        audioUrlRef.current = URL.createObjectURL(audioBlob);
        audio.src = audioUrlRef.current;
        await audio.play();
      }
    } catch (speechError) {
      if (speechControllerRef.current === controller) speechControllerRef.current = null;
      stopSpeech();
      if (speechError?.name === "AbortError" && controller.signal.reason === "cancelled") return;
      setError(
        speechError?.name === "AbortError" && controller.signal.reason === "timeout"
          ? "A geração do áudio demorou demasiado. Tenta novamente."
          : speechError?.name === "TypeError"
            ? "Não foi possível ligar ao serviço de voz."
            : speechError.message || "Não foi possível gerar a resposta em áudio.",
      );
    } finally {
      window.clearTimeout(timeoutId);
    }
  }, [assistantVoiceId, backendUrl, pulseVoiceSphere, setAssistantAudioActivity, stopSpeech]);

  const applyClientAction = useCallback((action) => {
    if (!action || action.type !== "change_theme") {
      throw new Error("O assistente devolveu uma alteração de tema inválida.");
    }
    if (action.scope === "global" && ["light", "dark"].includes(action.theme_id)) {
      saveTheme(action.theme_id);
      return;
    }
    if (
      action.scope === "chat_static"
      && (
        action.theme_id === DEFAULT_CHAT_THEME.id
        || CHAT_THEMES.some((theme) => theme.id === action.theme_id)
      )
    ) {
      setChatThemeId(action.theme_id);
      return;
    }
    if (
      action.scope === "chat_animated"
      && ANIMATED_CHAT_SCENES.some((scene) => scene.id === action.theme_id)
    ) {
      setChatAnimatedSceneId(action.theme_id);
      return;
    }
    throw new Error("O tema escolhido já não está disponível.");
  }, [setChatAnimatedSceneId, setChatThemeId]);

  const sendMessage = useCallback(async (value) => {
    const content = value.trim();
    const currentChat = useUserStore.getState().ChatAtivo;
    if (
      !content
      || isSending
      || currentChat?.tipo_chat !== ASSISTANT_CHAT_TYPE
      || !user?.id
    ) return;

    const currentMessages = useUserStore.getState().menssagens.filter(
      (message) => String(message.nossa_sala) === String(currentChat.nossa_sala),
    );
    const userMessage = createChatMessage("user", content, currentChat, user);
    const conversation = [
      ...currentMessages,
      userMessage,
    ].slice(-20)
      .filter((message) => typeof message.menssagem === "string" && message.menssagem.trim())
      .map((message) => ({
        role: String(message.id_remitente) === ASSISTANT_CHAT_ID ? "assistant" : "user",
        content: message.menssagem,
      }));

    setMenssagem(userMessage);
    setDraft("");
    setError("");
    setPendingAction(null);
    setIsSending(true);
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 60000);

    try {
      const base = String(backendUrl || "").replace(/\/+$/, "");
      if (!base) throw new Error("O endereço do backend não está configurado.");

      const response = await fetchComAuth(`${base}/api/assistente-ia/chat`, {
        method: "POST",
        body: JSON.stringify({
          audio_mode: mode === "audio",
          messages: conversation,
        }),
        signal: controller.signal,
        offlineQueue: false,
      });
      const responseText = await response.text();
      let data = null;
      try {
        data = responseText ? JSON.parse(responseText) : null;
      } catch {
        data = null;
      }
      if (!response.ok) {
        const message = response.status === 404
          ? "A rota do assistente não está disponível no backend publicado. Atualiza o backend no Render."
          : data?.error || `Não foi possível contactar o assistente (${response.status}).`;
        throw new Error(message);
      }
      if (typeof data?.reply !== "string" || !data.reply.trim()) {
        throw new Error("O assistente não devolveu uma resposta válida.");
      }

      if (data.client_action) applyClientAction(data.client_action);
      const assistantMessage = createChatMessage("assistant", data.reply.trim(), currentChat, user);
      setMenssagem(assistantMessage);
      if (data.pending_action) {
        setPendingAction({
          ...data.pending_action,
          selectedImageIndex: 0,
        });
      }
      if (mode === "audio") {
        const speechText = prepareSpeechText(data.spoken_reply || assistantMessage.menssagem);
        if (speechText) void speak(speechText);
      }
    } catch (requestError) {
      setError(
        requestError?.name === "TimeoutError" || requestError?.name === "AbortError"
          ? "O assistente demorou demasiado a responder. Tenta novamente."
          : requestError?.name === "TypeError"
            ? "Não foi possível ligar ao backend. Verifica a ligação e o endereço da API."
            : requestError.message || "Não foi possível contactar o assistente.",
      );
    } finally {
      window.clearTimeout(timeoutId);
      setIsSending(false);
    }
  }, [applyClientAction, backendUrl, isSending, mode, setMenssagem, speak, user]);

  const confirmPendingAction = async () => {
    if (!pendingAction || isExecutingAction) return;
    const currentChat = useUserStore.getState().ChatAtivo;
    if (currentChat?.tipo_chat !== ASSISTANT_CHAT_TYPE || !user?.id) return;

    setIsExecutingAction(true);
    setError("");
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 30000);
    try {
      const base = String(backendUrl || "").replace(/\/+$/, "");
      if (!base) throw new Error("O endereço do backend não está configurado.");
      const response = await fetchComAuth(`${base}/api/assistente-ia/actions/execute`, {
        method: "POST",
        body: JSON.stringify({
          token: pendingAction.token,
          ...(pendingAction.images?.length
            ? { image_index: pendingAction.selectedImageIndex }
            : {}),
        }),
        signal: controller.signal,
        offlineQueue: false,
      });
      const responseText = await response.text();
      let data = null;
      try {
        data = responseText ? JSON.parse(responseText) : null;
      } catch {
        data = null;
      }
      if (!response.ok) {
        throw new Error(data?.error || `Não foi possível confirmar a ação (${response.status}).`);
      }
      if (typeof data?.reply !== "string" || !data.reply.trim()) {
        throw new Error("O backend não confirmou o registo.");
      }
      setPendingAction(null);
      const assistantMessage = createChatMessage("assistant", data.reply, currentChat, user);
      setMenssagem(assistantMessage);
      if (mode === "audio") {
        const speechText = prepareSpeechText(assistantMessage.menssagem);
        if (speechText) void speak(speechText);
      }
    } catch (requestError) {
      setError(
        requestError?.name === "TimeoutError" || requestError?.name === "AbortError"
          ? "A confirmação demorou demasiado. Verifica se o registo foi criado antes de tentar novamente."
          : requestError?.name === "TypeError"
            ? "Não foi possível ligar ao backend para confirmar a ação."
            : requestError.message || "Não foi possível confirmar a ação.",
      );
    } finally {
      window.clearTimeout(timeoutId);
      setIsExecutingAction(false);
    }
  };

  const changeMode = (nextMode) => {
    if (nextMode === mode) return;
    stopSpeech();
    setAssistantAudioMode(nextMode === "audio");
    setError("");
  };

  const toggleListening = () => {
    if (!SpeechRecognitionAPI) {
      setError("O reconhecimento de voz não está disponível neste navegador. Podes escrever a mensagem.");
      return;
    }
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      return;
    }

    setError("");
    stopSpeech();
    const recognition = new SpeechRecognitionAPI();
    recognition.lang = "pt-PT";
    recognition.interimResults = true;
    recognition.continuous = false;
    recognition.onresult = (event) => {
      const result = event.results[event.results.length - 1];
      const transcript = result?.[0]?.transcript?.trim() || "";
      setDraft(transcript);
      if (result?.isFinal && transcript) {
        recognition.stop();
        void sendMessage(transcript);
      }
    };
    recognition.onerror = () => {
      setError("Não foi possível reconhecer a voz. Verifica a permissão do microfone.");
      setIsListening(false);
      recognitionRef.current = null;
    };
    recognition.onend = () => {
      setIsListening(false);
      recognitionRef.current = null;
    };
    recognitionRef.current = recognition;
    setIsListening(true);
    try {
      recognition.start();
    } catch {
      recognitionRef.current = null;
      setIsListening(false);
      setError("Não foi possível iniciar o microfone. Verifica a permissão do navegador.");
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    void sendMessage(draft);
  };

  const statusText = error
    ? "Atenção"
    : isSpeaking
      ? "A falar…"
      : isListening
        ? "A ouvir…"
        : isSending
          ? "A responder…"
          : "Online";
  const selectedAssistantVoice = ASSISTANT_VOICES.find((voice) => voice.id === assistantVoiceId)
    || ASSISTANT_VOICES[0];

  return (
    <div className="ConteinerRightMenuBottom assistantMainComposer" data-audio-mode={mode === "audio"}>
      {pendingAction && (
        <section className="assistantActionPreview" role="dialog" aria-label="Confirmar ação do assistente">
          <div className="assistantActionPreviewHeading">
            <strong>{pendingAction.title}</strong>
            <button
              type="button"
              className="assistantActionCancel"
              onClick={() => setPendingAction(null)}
              disabled={isExecutingAction}
              aria-label="Cancelar ação"
            >
              ×
            </button>
          </div>
          <p className="assistantActionSummary">{pendingAction.summary}</p>
          {pendingAction.preview_image && (
            <img
              className="assistantActionPreviewImage"
              src={pendingAction.preview_image}
              alt="Imagem associada ao anúncio"
            />
          )}
          {pendingAction.images?.length > 0 && (
            <div className="assistantActionImages" aria-label="Escolher imagem licenciada">
              {pendingAction.images.map((image, index) => (
                <div
                  className={`assistantActionImageOption${pendingAction.selectedImageIndex === index ? " selected" : ""}`}
                  key={image.source_url}
                >
                  <button
                    type="button"
                    aria-pressed={pendingAction.selectedImageIndex === index}
                    onClick={() => setPendingAction((current) => current
                      ? { ...current, selectedImageIndex: index }
                      : current)}
                  >
                    <img src={image.preview_url} alt={image.title} loading="lazy" />
                    <span>{image.creator}</span>
                    <small>{image.license}</small>
                  </button>
                  <a href={image.source_url} target="_blank" rel="noreferrer">
                    Ver origem e licença
                  </a>
                </div>
              ))}
            </div>
          )}
          <div className="assistantActionButtons">
            <button
              type="button"
              className="assistantActionConfirm"
              onClick={() => void confirmPendingAction()}
              disabled={isExecutingAction || isSending}
            >
              {isExecutingAction ? "A registar…" : "Confirmar e registar"}
            </button>
            <button
              type="button"
              className="assistantActionCancelText"
              onClick={() => setPendingAction(null)}
              disabled={isExecutingAction}
            >
              Cancelar
            </button>
          </div>
        </section>
      )}
      {mode === "text" && assistantMessages.length <= 1 && (
        <div className="assistantQuickPrompts" aria-label="Sugestões para o assistente">
          {QUICK_PROMPTS.map((prompt) => (
            <button type="button" key={prompt} onClick={() => void sendMessage(prompt)} disabled={isSending}>
              {prompt}
            </button>
          ))}
        </div>
      )}
      {mode === "audio" && (
        <div className="assistantStyles" aria-label="Estilos do assistente">
          {ASSISTANT_VOICE_STYLES.map((style, index) => (
            <button
              type="button"
              key={style}
              className="assistantStyleButton"
              aria-pressed={voiceStyle === index}
              onClick={() => {
                setVoiceStyle(index);
                setAssistantAudioActivity({ styleIndex: index });
              }}
            >
              {index + 1} · {style}
            </button>
          ))}
        </div>
      )}
      <div className="assistantControls">
        <div className="assistantStatus" role="status">
          <span className={`assistantStatusDot${error ? " error" : isSpeaking || isListening ? " active" : ""}`} />
          {statusText}
        </div>
        <div className="assistantVoicePicker" ref={voicePickerRef}>
          <button
            type="button"
            className="assistantVoiceButton"
            aria-haspopup="menu"
            aria-expanded={voicePickerOpen}
            aria-label={`Escolher voz do assistente. Atual: ${selectedAssistantVoice.name}`}
            onClick={() => setVoicePickerOpen((open) => !open)}
          >
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M4 10v4h4l5 4V6l-5 4H4Z" />
              <path d="M16 9a5 5 0 0 1 0 6M18.5 6.5a9 9 0 0 1 0 11" />
            </svg>
            <span>Voz</span>
            <strong>{selectedAssistantVoice.name}</strong>
          </button>
          {voicePickerOpen && (
            <div className="assistantVoiceMenu" role="menu" aria-label="Tipo de voz">
              <p>Escolhe a voz do assistente</p>
              {ASSISTANT_VOICES.map((voice) => (
                <button
                  type="button"
                  key={voice.id}
                  role="menuitemradio"
                  aria-checked={assistantVoiceId === voice.id}
                  className={assistantVoiceId === voice.id ? "selected" : ""}
                  onClick={() => {
                    stopSpeech();
                    setAssistantVoiceId(voice.id);
                    setVoicePickerOpen(false);
                  }}
                >
                  <span>
                    <strong>{voice.name}</strong>
                    <small>{voice.gender} · {voice.locale}</small>
                  </span>
                  {assistantVoiceId === voice.id && <i aria-hidden="true">✓</i>}
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="assistantModeSwitch" role="group" aria-label="Modo de conversa">
          <button type="button" aria-pressed={mode === "text"} onClick={() => changeMode("text")}>Texto</button>
          <button type="button" aria-pressed={mode === "audio"} onClick={() => changeMode("audio")}>Áudio</button>
        </div>
      </div>
      {error && <p className="assistantError" role="alert">{error}</p>}
      <form className="assistantComposer" onSubmit={handleSubmit}>
        <button
          type="button"
          className={`assistantMicButton${isListening ? " listening" : ""}`}
          onClick={toggleListening}
          aria-label={isListening ? "Parar de ouvir" : "Falar ao microfone"}
          title={SpeechRecognitionAPI ? "Falar ao microfone" : "Reconhecimento de voz indisponível"}
        >
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <rect x="9" y="3" width="6" height="12" rx="3" />
            <path d="M5 11a7 7 0 0 0 14 0M12 18v3" />
          </svg>
        </button>
        <textarea
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              void sendMessage(draft);
            }
          }}
          placeholder={isListening ? "Estou a ouvir…" : "Escreve a tua mensagem…"}
          aria-label="Mensagem para o assistente"
          autoComplete="off"
          maxLength={4000}
          rows={1}
          disabled={isSending}
        />
        <button
          type="submit"
          className="assistantSendButton"
          aria-label="Enviar mensagem"
          disabled={isSending || !draft.trim()}
        >
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="m22 2-7 20-4-9-9-4 20-7ZM22 2 11 13" />
          </svg>
        </button>
      </form>
    </div>
  );
}
