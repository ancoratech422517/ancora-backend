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

function releaseAssistantImage(url) {
  if (typeof url === "string" && url.startsWith("blob:")) URL.revokeObjectURL(url);
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
  const setProdutoUsuario = useUserStore((state) => state.setProdutoUsuario);
  const setTodosProdutos = useUserStore((state) => state.setTodosProdutos);
  const assistantAudioMode = useUserStore((state) => state.assistantAudioMode);
  const setAssistantAudioMode = useUserStore((state) => state.setAssistantAudioMode);
  const setAssistantAudioActivity = useUserStore((state) => state.setAssistantAudioActivity);
  const setAssistantCommandStatus = useUserStore((state) => state.setAssistantCommandStatus);
  const setChatThemeId = useUserStore((state) => state.setChatThemeId);
  const setChatAnimatedSceneId = useUserStore((state) => state.setChatAnimatedSceneId);
  const setAtivar = useUserStore((state) => state.setAtivar);
  const returnFromAssistantChat = useUserStore((state) => state.returnFromAssistantChat);
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
  const pendingActionRef = useRef(pendingAction);
  const [isExecutingAction, setIsExecutingAction] = useState(false);
  const [commandActive, setCommandActive] = useState(false);
  const recognitionRef = useRef(null);
  const voiceSessionActiveRef = useRef(false);
  const chatControllerRef = useRef(null);
  const cancelledChatRequestRef = useRef(false);
  const restartListeningTimeoutRef = useRef(null);
  const imageFileInputRef = useRef(null);
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
    pendingActionRef.current = pendingAction;
  }, [pendingAction]);

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

  const stopAssistantCommand = useCallback(() => {
    voiceSessionActiveRef.current = false;
    recognitionRef.current?.abort?.();
    recognitionRef.current?.stop?.();
    recognitionRef.current = null;
    if (restartListeningTimeoutRef.current) {
      window.clearTimeout(restartListeningTimeoutRef.current);
      restartListeningTimeoutRef.current = null;
    }
    if (chatControllerRef.current) {
      cancelledChatRequestRef.current = true;
      chatControllerRef.current.abort();
      chatControllerRef.current = null;
    }
    stopSpeech();
    setIsListening(false);
    setCommandActive(false);
    setAssistantCommandStatus("idle");
  }, [setAssistantCommandStatus, stopSpeech]);

  useEffect(() => () => {
    voiceSessionActiveRef.current = false;
    recognitionRef.current?.abort?.();
    recognitionRef.current?.stop?.();
    chatControllerRef.current?.abort();
    releaseAssistantImage(pendingActionRef.current?.custom_image_url);
    stopSpeech(false);
    setAssistantCommandStatus("idle");
  }, [setAssistantCommandStatus, stopSpeech]);

  useEffect(() => {
    if (!commandActive) {
      setAssistantCommandStatus("idle");
    } else if (isListening) {
      setAssistantCommandStatus("listening");
    } else if (isSending || isExecutingAction) {
      setAssistantCommandStatus("working");
    } else if (isSpeaking) {
      setAssistantCommandStatus("speaking");
    } else if (pendingAction) {
      setAssistantCommandStatus("confirming");
    } else {
      setAssistantCommandStatus("working");
    }
  }, [
    commandActive, isExecutingAction, isListening, isSending, isSpeaking,
    pendingAction, setAssistantCommandStatus,
  ]);

  useEffect(() => {
    const handleStop = () => stopAssistantCommand();
    const handleManualTakeover = (event) => {
      if (!voiceSessionActiveRef.current && !commandActive) return;
      if (event.target?.closest?.(".assistantMainComposer, .assistantCommandOrb")) return;
      stopAssistantCommand();
    };
    window.addEventListener("ancora:assistant-stop", handleStop);
    document.addEventListener("pointerdown", handleManualTakeover, true);
    return () => {
      window.removeEventListener("ancora:assistant-stop", handleStop);
      document.removeEventListener("pointerdown", handleManualTakeover, true);
    };
  }, [commandActive, stopAssistantCommand]);

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
        if (!voiceSessionActiveRef.current && !pendingActionRef.current) setCommandActive(false);
      };
      utterance.onerror = (event) => {
        browserSpeechRef.current = null;
        setIsSpeaking(false);
        setAssistantAudioActivity({ speaking: false });
        if (!voiceSessionActiveRef.current && !pendingActionRef.current) setCommandActive(false);
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
      audio.onended = () => {
        stopSpeech();
        if (!voiceSessionActiveRef.current && !pendingActionRef.current) setCommandActive(false);
      };
      audio.onerror = () => {
        stopSpeech();
        if (!voiceSessionActiveRef.current && !pendingActionRef.current) setCommandActive(false);
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
    if (action?.type === "navigate_tab") {
      const allowedDestinations = new Set([
        "conteiner1", "conteiner2", "conteiner3", "conteiner4",
        "conteiner5", "conteiner8", "academy",
      ]);
      if (!allowedDestinations.has(action.destination)) {
        throw new Error("A aba escolhida já não está disponível.");
      }
      returnFromAssistantChat();
      setAtivar(action.destination);
      return;
    }
    if (!action || action.type !== "change_theme") {
      throw new Error("O assistente devolveu uma alteração não suportada.");
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
  }, [returnFromAssistantChat, setAtivar, setChatAnimatedSceneId, setChatThemeId]);

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
    releaseAssistantImage(pendingActionRef.current?.custom_image_url);
    setPendingAction(null);
    setIsSending(true);
    setCommandActive(true);
    cancelledChatRequestRef.current = false;
    const controller = new AbortController();
    chatControllerRef.current = controller;
    const timeoutId = window.setTimeout(() => controller.abort(), 60000);
    let requiresConfirmation = false;

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

      const assistantMessage = createChatMessage("assistant", data.reply.trim(), currentChat, user);
      setMenssagem(assistantMessage);
      const preparedAction = data.pending_action || (data.client_action
        ? {
          title: data.client_action.type === "navigate_tab" ? "Confirmar navegação" : "Confirmar alteração de tema",
          summary: "Revê esta alteração e confirma antes de continuar.",
          images: [],
          client_action: data.client_action,
        }
        : null);
      if (preparedAction) {
        requiresConfirmation = true;
        setPendingAction({
          ...preparedAction,
          selectedImageIndex: preparedAction.images?.length ? 0 : null,
        });
      }
      if (mode === "audio") {
        const speechText = prepareSpeechText(data.spoken_reply || assistantMessage.menssagem);
        if (speechText) void speak(speechText);
      }
    } catch (requestError) {
      if (cancelledChatRequestRef.current && requestError?.name === "AbortError") return;
      setError(
        requestError?.name === "TimeoutError" || requestError?.name === "AbortError"
          ? "O assistente demorou demasiado a responder. Tenta novamente."
          : requestError?.name === "TypeError"
            ? "Não foi possível ligar ao backend. Verifica a ligação e o endereço da API."
            : requestError.message || "Não foi possível contactar o assistente.",
      );
    } finally {
      window.clearTimeout(timeoutId);
      if (chatControllerRef.current === controller) chatControllerRef.current = null;
      setIsSending(false);
      if (!requiresConfirmation && !voiceSessionActiveRef.current && mode !== "audio") {
        setCommandActive(false);
      }
    }
  }, [backendUrl, isSending, mode, setMenssagem, speak, user]);

  const confirmPendingAction = async () => {
    if (!pendingAction || isExecutingAction) return;
    const currentChat = useUserStore.getState().ChatAtivo;
    if (currentChat?.tipo_chat !== ASSISTANT_CHAT_TYPE || !user?.id) return;

    if (pendingAction.client_action) {
      try {
        applyClientAction(pendingAction.client_action);
        setPendingAction(null);
        setCommandActive(false);
        if (pendingAction.client_action.type !== "navigate_tab") {
          setMenssagem(createChatMessage(
            "assistant",
            "Alteração aplicada com sucesso.",
            currentChat,
            user,
          ));
        }
      } catch (actionError) {
        setError(actionError.message || "Não foi possível aplicar esta ação.");
      }
      return;
    }

    setIsExecutingAction(true);
    setCommandActive(true);
    setError("");
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 30000);
    try {
      const base = String(backendUrl || "").replace(/\/+$/, "");
      if (!base) throw new Error("O endereço do backend não está configurado.");
      const requestBody = pendingAction.custom_image_file
        ? (() => {
          const formData = new FormData();
          formData.append("token", pendingAction.token);
          formData.append("image", pendingAction.custom_image_file, pendingAction.custom_image_name || "imagem.png");
          if (pendingAction.rightsConfirmed === true) formData.append("rights_confirmed", "true");
          return formData;
        })()
        : JSON.stringify({
          token: pendingAction.token,
          ...(requiresImageRightsConfirmation
            ? { rights_confirmed: pendingAction.rightsConfirmed === true }
            : {}),
          ...(pendingAction.images?.length
            ? { image_index: pendingAction.selectedImageIndex }
            : {}),
        });
      const response = await fetchComAuth(`${base}/api/assistente-ia/actions/execute`, {
        method: "POST",
        body: requestBody,
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
      if (data.result?.resource === "produto") {
        const refreshProductList = async (path, updateList) => {
          const listResponse = await fetchComAuth(`${base}/${path}/${user.id}`, {
            method: "GET",
            signal: controller.signal,
            offlineQueue: false,
          });
          if (!listResponse.ok) {
            throw new Error(`Não foi possível atualizar ${path}.`);
          }
          const list = await listResponse.json();
          if (!Array.isArray(list)) throw new Error(`A lista ${path} é inválida.`);
          updateList(list);
        };
        const refreshResults = await Promise.allSettled([
          refreshProductList("buscar_produto_usuario", setProdutoUsuario),
          refreshProductList("buscar_todos_produtos", setTodosProdutos),
        ]);
        refreshResults.forEach((refreshResult) => {
          if (refreshResult.status === "rejected") {
            console.warn("Produto criado, mas uma lista da loja não foi atualizada:", refreshResult.reason);
          }
        });
      }
      releaseAssistantImage(pendingAction.custom_image_url);
      setPendingAction(null);
      const assistantMessage = createChatMessage("assistant", data.reply, currentChat, user);
      setMenssagem(assistantMessage);
      if (mode === "audio") {
        const speechText = prepareSpeechText(assistantMessage.menssagem);
        if (speechText) void speak(speechText);
      }
      if (mode !== "audio" && !voiceSessionActiveRef.current) setCommandActive(false);
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

  const handleAssistantImageUpload = (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || !pendingAction) return;
    const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
    if (!allowedTypes.has(file.type) || file.size <= 0 || file.size > 8 * 1024 * 1024) {
      setError("Escolhe uma imagem JPG, PNG ou WebP até 8 MB.");
      return;
    }
    releaseAssistantImage(pendingAction.custom_image_url);
    const previewUrl = URL.createObjectURL(file);
    setError("");
    setPendingAction((current) => current
      ? {
        ...current,
        custom_image_file: file,
        custom_image_url: previewUrl,
        custom_image_name: file.name,
        selectedImageIndex: null,
          rightsConfirmed: false,
      }
      : current);
  };

  const changeMode = (nextMode) => {
    if (nextMode === mode) return;
    voiceSessionActiveRef.current = false;
    recognitionRef.current?.stop?.();
    recognitionRef.current = null;
    setIsListening(false);
    if (!pendingAction && !isSending && !isSpeaking) setCommandActive(false);
    stopSpeech();
    setAssistantAudioMode(nextMode === "audio");
    setError("");
  };

  const startListening = useCallback(() => {
    if (!SpeechRecognitionAPI || recognitionRef.current || !voiceSessionActiveRef.current || pendingActionRef.current) return;
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
    recognition.onerror = (event) => {
      if (event.error !== "aborted" && voiceSessionActiveRef.current) {
        setError("Não foi possível reconhecer a voz. Verifica a permissão do microfone.");
        voiceSessionActiveRef.current = false;
        setCommandActive(false);
      }
      setIsListening(false);
      recognitionRef.current = null;
    };
    recognition.onend = () => {
      setIsListening(false);
      if (recognitionRef.current === recognition) recognitionRef.current = null;
    };
    recognitionRef.current = recognition;
    setIsListening(true);
    try {
      recognition.start();
    } catch {
      recognitionRef.current = null;
      setIsListening(false);
      voiceSessionActiveRef.current = false;
      setCommandActive(false);
      setError("Não foi possível iniciar o microfone. Verifica a permissão do navegador.");
    }
  }, [SpeechRecognitionAPI, sendMessage]);

  useEffect(() => {
    if (
      !voiceSessionActiveRef.current || mode !== "audio" || pendingAction
      || isListening || isSending || isSpeaking || isExecutingAction
    ) return undefined;
    restartListeningTimeoutRef.current = window.setTimeout(() => {
      restartListeningTimeoutRef.current = null;
      startListening();
    }, 450);
    return () => {
      if (restartListeningTimeoutRef.current) {
        window.clearTimeout(restartListeningTimeoutRef.current);
        restartListeningTimeoutRef.current = null;
      }
    };
  }, [
    isExecutingAction, isListening, isSending, isSpeaking,
    mode, pendingAction, startListening,
  ]);

  const toggleListening = () => {
    if (!SpeechRecognitionAPI) {
      setError("O reconhecimento de voz não está disponível neste navegador. Podes escrever a mensagem.");
      return;
    }
    if (voiceSessionActiveRef.current) {
      stopAssistantCommand();
      return;
    }
    setError("");
    setAssistantAudioMode(true);
    voiceSessionActiveRef.current = true;
    setCommandActive(true);
    stopSpeech();
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
  const selectedImage = pendingAction?.images?.[pendingAction.selectedImageIndex];
  const requiresImageRightsConfirmation = Boolean(
    pendingAction && (
      pendingAction.action_type === "produto"
      || pendingAction.custom_image_file
      || (selectedImage && !selectedImage.license_allows_commercial_use)
    ),
  );

  return (
    <div className="ConteinerRightMenuBottom assistantMainComposer" data-audio-mode={mode === "audio"}>
      {pendingAction && (
        <section className="assistantActionPreview" role="dialog" aria-label="Confirmar ação do assistente">
          <div className="assistantActionPreviewHeading">
            <strong>{pendingAction.title}</strong>
            <button
              type="button"
              className="assistantActionCancel"
              onClick={() => {
                releaseAssistantImage(pendingAction.custom_image_url);
                setPendingAction(null);
                if (!voiceSessionActiveRef.current) setCommandActive(false);
              }}
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
          {pendingAction.custom_image_url && (
            <div className="assistantLocalImagePreview">
              <img src={pendingAction.custom_image_url} alt="Pré-visualização da imagem escolhida" />
              <span>Imagem escolhida do dispositivo</span>
            </div>
          )}
          {pendingAction.images?.length > 0 && (
            <div className="assistantActionImages" aria-label="Escolher imagem reutilizável">
              {pendingAction.images.map((image, index) => (
                <div
                  className={`assistantActionImageOption${pendingAction.selectedImageIndex === index ? " selected" : ""}`}
                  key={image.source_url}
                >
                  <button
                    type="button"
                    aria-pressed={pendingAction.selectedImageIndex === index}
                    onClick={() => {
                      releaseAssistantImage(pendingAction.custom_image_url);
                      setPendingAction((current) => current
                        ? {
                          ...current,
                          selectedImageIndex: index,
                          custom_image_file: null,
                          custom_image_url: null,
                          custom_image_name: null,
                          rightsConfirmed: false,
                        }
                        : current);
                    }}
                  >
                    <img src={image.preview_url} alt={image.title} loading="lazy" />
                    <span>{image.creator}</span>
                    <small>
                      {image.license_allows_commercial_use
                        ? image.license
                        : `${image.license} · confirma autorização de uso`}
                    </small>
                  </button>
                  <a href={image.source_url} target="_blank" rel="noreferrer">
                    Ver origem e licença
                  </a>
                </div>
              ))}
            </div>
          )}
          {pendingAction.can_upload_image && (
            <div className="assistantLocalImagePicker">
              <input
                ref={imageFileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleAssistantImageUpload}
                hidden
              />
              <button
                type="button"
                onClick={() => imageFileInputRef.current?.click()}
                disabled={isExecutingAction}
              >
                {pendingAction.custom_image_url ? "Escolher outra imagem" : "Escolher imagem no dispositivo"}
              </button>
              <small>JPG, PNG ou WebP · máximo 8 MB</small>
            </div>
          )}
          {requiresImageRightsConfirmation && (
            <label className="assistantImageRightsConfirmation">
              <input
                type="checkbox"
                checked={pendingAction.rightsConfirmed === true}
                onChange={(event) => setPendingAction((current) => current
                  ? { ...current, rightsConfirmed: event.target.checked }
                  : current)}
                disabled={isExecutingAction}
              />
              <span>
                {pendingAction.action_type === "produto"
                  ? "Confirmo que sou titular ou tenho autorização para usar comercialmente esta imagem."
                  : "Confirmo que sou titular ou tenho autorização para utilizar esta imagem."}
              </span>
            </label>
          )}
          <div className="assistantActionButtons">
            <button
              type="button"
              className="assistantActionConfirm"
              onClick={() => void confirmPendingAction()}
              disabled={
                isExecutingAction || isSending
                || (pendingAction.requires_image
                  && !pendingAction.custom_image_file
                  && (!pendingAction.images?.length || pendingAction.selectedImageIndex == null))
                || (requiresImageRightsConfirmation && pendingAction.rightsConfirmed !== true)
              }
            >
              {isExecutingAction ? "A registar…" : "Confirmar"}
            </button>
            <button
              type="button"
              className="assistantActionCancelText"
              onClick={() => {
                releaseAssistantImage(pendingAction.custom_image_url);
                setPendingAction(null);
                if (!voiceSessionActiveRef.current) setCommandActive(false);
              }}
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
