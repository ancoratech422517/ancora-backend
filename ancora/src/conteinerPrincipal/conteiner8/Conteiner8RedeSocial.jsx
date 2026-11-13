import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useUserStore } from "../../useUseSotore";
import LogoAncora from "../../assets/logo2.png";
import CachedImage from "../../components/CachedImage";
import { socialApi } from "./socialApi";
import "./css/Conteiner8RedeSocial.css";

const MAX_MEDIA_BYTES = 100 * 1024 * 1024;
const NAV_ITEMS = [
  { id: "home", label: "Início", icon: "home" },
  { id: "explore", label: "Explorar", icon: "search" },
  { id: "activity", label: "Notificações", icon: "bell" },
  { id: "messages", label: "Mensagens", icon: "message" },
  { id: "saved", label: "Guardados", icon: "bookmark" },
  { id: "profile", label: "Perfil", icon: "user" },
];
const TOP_NAV_ITEMS = [
  { id: "home", label: "Feed" },
  { id: "explore", label: "Explorar" },
  { id: "saved", label: "Guardados" },
  { id: "messages", label: "Mensagens" },
];
const ICONS = {
  home: "M3 11l9-8 9 8M5 10v10h5v-6h4v6h5V10",
  search: "M11 4a7 7 0 100 14 7 7 0 000-14zM21 21l-5-5",
  bell: "M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9M10 21h4",
  message: "M21 12a8 8 0 01-11.5 7L3 21l2-5.5A8 8 0 1121 12z",
  bookmark: "M6 3h12v18l-6-4-6 4z",
  user: "M12 12a4 4 0 100-8 4 4 0 000 8zM4 21c0-4 4-6 8-6s8 2 8 6",
  heart: "M12 21s-8-5-8-11a4.5 4.5 0 018-3 4.5 4.5 0 018 3c0 6-8 11-8 11z",
  share: "M4 12v7h16v-7M12 3v12M7 8l5-5 5 5",
  plus: "M12 5v14M5 12h14",
  image: "M4 4h16v16H4zM4 16l5-5 4 4 3-3 4 4M9 9h.01",
  video: "M4 6h12a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V8a2 2 0 012-2zM18 10l4-3v10l-4-3",
  pin: "M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1116 0zM12 10a2.5 2.5 0 100-5 2.5 2.5 0 000 5z",
  more: "M5 12h.01M12 12h.01M19 12h.01",
  arrow: "M7 17 17 7M7 7h10v10",
  close: "M18 6L6 18M6 6l12 12",
  send: "M22 2L11 13M22 2l-7 20-4-9-9-4z",
  trash: "M3 6h18M8 6V4h8v2m3 0-1 14H6L5 6m5 4v6m4-6v6",
  menu: "M3 6h18M3 12h18M3 18h18",
};

function Icon({ name, size = 20, fill = "none" }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={fill}
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={ICONS[name]} />
    </svg>
  );
}

function timeAgo(value) {
  if (!value) return "agora";
  const minutes = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 60000));
  if (minutes < 1) return "agora";
  if (minutes < 60) return `há ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `há ${hours} h`;
  return `há ${Math.floor(hours / 24)} d`;
}

function Avatar({ user, size = 42, backend = "" }) {
  const photo = user?.foto_usuario;
  const photoUrl = photo && String(photo).toLowerCase() !== "none"
    ? (photo.startsWith("http") ? photo : `${backend}/${photo.replace(/^\/+/, "")}`)
    : "";
  const initials = (user?.nome || "?").trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
  return (
    <span className={`social-avatar social-avatar-${size}`}>
      {photoUrl ? <CachedImage src={photoUrl} alt="" /> : initials}
    </span>
  );
}

function SocialNetwork() {
  const user = useUserStore((state) => state.dadosUsuario);
  const userId = user?.id;
  const backend = useUserStore((state) => state.urlBancoDeDados);
  const setAtivar = useUserStore((state) => state.setAtivar);
  const [section, setSection] = useState("home");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [feedMode, setFeedMode] = useState("for-you");
  const [search, setSearch] = useState("");
  const [posts, setPosts] = useState([]);
  const [stories, setStories] = useState([]);
  const [people, setPeople] = useState([]);
  const [activity, setActivity] = useState([]);
  const [myStats, setMyStats] = useState(null);
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [profileStats, setProfileStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [draft, setDraft] = useState("");
  const [location, setLocation] = useState("");
  const [attachment, setAttachment] = useState(null);
  const [attachmentPreview, setAttachmentPreview] = useState("");
  const [storyComposer, setStoryComposer] = useState(false);
  const [storyDraft, setStoryDraft] = useState("");
  const [storyAttachment, setStoryAttachment] = useState(null);
  const [storyPreview, setStoryPreview] = useState("");
  const [activeStory, setActiveStory] = useState(null);
  const [commentsPost, setCommentsPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [commentDraft, setCommentDraft] = useState("");
  const [busyAction, setBusyAction] = useState("");
  const attachmentRef = useRef(null);
  const storyAttachmentRef = useRef(null);
  const noticeTimer = useRef(null);

  useEffect(() => {
    if (!mobileMenuOpen) return undefined;
    const closeOnEscape = (event) => {
      if (event.key === "Escape") setMobileMenuOpen(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [mobileMenuOpen]);

  const showNotice = useCallback((message) => {
    setNotice(message);
    if (noticeTimer.current) clearTimeout(noticeTimer.current);
    noticeTimer.current = setTimeout(() => setNotice(""), 3200);
  }, []);

  const showError = useCallback((reason) => {
    setError(reason?.message || "Ocorreu um erro. Tenta novamente.");
  }, []);

  const requestPosts = useCallback(async () => {
    if (!userId || section === "activity" || section === "messages") {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");
    const params = {
      feed: section === "saved" ? "saved" : section === "profile" ? "for-you" : feedMode,
      q: search.trim(),
    };
    if (section === "profile") params.author_id = String(selectedProfile?.id || userId);
    try {
      const response = await socialApi.posts(params);
      setPosts(response.items || []);
    } catch (reason) {
      if (reason?.queued) {
        setDraft("");
        setLocation("");
        setAttachment(null);
        setAttachmentPreview("");
        if (attachmentRef.current) attachmentRef.current.value = "";
        showNotice("Publicação guardada; será publicada quando a ligação voltar.");
      } else {
        showError(reason);
      }
    } finally {
      setLoading(false);
    }
  }, [feedMode, search, section, selectedProfile?.id, showError, userId]);

  useEffect(() => {
    const timer = setTimeout(() => void requestPosts(), search ? 250 : 0);
    return () => clearTimeout(timer);
  }, [requestPosts, search]);

  const loadStoriesAndUsers = useCallback(async () => {
    if (!userId) return;
    try {
      const [storyResponse, userResponse] = await Promise.all([
        socialApi.stories(),
        socialApi.users({ limit: 30 }),
      ]);
      setStories(storyResponse.items || []);
      setPeople(userResponse.items || []);
    } catch (reason) {
      if (reason?.queued) {
        setStoryDraft("");
        setStoryAttachment(null);
        setStoryPreview("");
        setStoryComposer(false);
        if (storyAttachmentRef.current) storyAttachmentRef.current.value = "";
        showNotice("Story guardado; será publicado quando a ligação voltar.");
      } else {
        showError(reason);
      }
    }
  }, [showError, userId]);

  useEffect(() => {
    if (!userId) return undefined;
    let active = true;
    Promise.all([socialApi.stories(), socialApi.users({ limit: 30 })])
      .then(([storyResponse, userResponse]) => {
        if (!active) return;
        setStories(storyResponse.items || []);
        setPeople(userResponse.items || []);
      })
      .catch(showError);
    return () => {
      active = false;
    };
  }, [showError, userId]);

  useEffect(() => {
    if (section !== "activity") return;
    socialApi.activity()
      .then((response) => setActivity(response.items || []))
      .catch(showError);
  }, [section, showError]);

  useEffect(() => {
    if (section !== "explore") return undefined;
    let active = true;
    const timer = setTimeout(() => {
      socialApi.users(search.trim() ? { q: search.trim(), limit: 30 } : { limit: 30 })
        .then((response) => {
          if (active) setPeople(response.items || []);
        })
        .catch(showError);
    }, search ? 250 : 0);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [search, section, showError]);

  useEffect(() => {
    if (section !== "profile") return;
    const profileId = selectedProfile?.id || userId;
    if (!profileId) return;
    socialApi.profile(profileId)
      .then((response) => setProfileStats(response.user))
      .catch(showError);
  }, [section, selectedProfile?.id, showError, userId]);

  useEffect(() => {
    if (!userId) return;
    socialApi.profile(userId)
      .then((response) => setMyStats(response.user))
      .catch(showError);
  }, [showError, userId]);

  useEffect(() => {
    return () => {
      if (attachmentPreview) URL.revokeObjectURL(attachmentPreview);
    };
  }, [attachmentPreview]);

  useEffect(() => {
    return () => {
      if (storyPreview) URL.revokeObjectURL(storyPreview);
    };
  }, [storyPreview]);

  const storyGroups = useMemo(() => {
    const groups = new Map();
    for (const story of stories) {
      const key = story.autor.id;
      if (!groups.has(key)) groups.set(key, { author: story.autor, items: [] });
      groups.get(key).items.push(story);
    }
    return [...groups.values()];
  }, [stories]);

  const activeProfile = section === "profile"
    ? selectedProfile || user
    : null;

  const chooseSection = (nextSection) => {
    setMobileMenuOpen(false);
    setError("");
    if (nextSection === "messages") {
      setAtivar("conteiner1");
      return;
    }
    if (nextSection === "profile") {
      setSelectedProfile(null);
      setProfileStats(null);
    }
    if (nextSection === "explore") setSearch("");
    setSection(nextSection);
  };

  const openProfile = (person) => {
    setSelectedProfile(person?.id === user?.id ? null : person);
    setProfileStats(null);
    setSearch("");
    setSection("profile");
  };

  const selectFile = (file, type) => {
    if (!file) return;
    if (!file.type.startsWith("image/") && !file.type.startsWith("video/")) {
      setError("Seleciona uma imagem ou vídeo.");
      return;
    }
    if (file.size > MAX_MEDIA_BYTES) {
      setError("O ficheiro deve ter no máximo 100 MB.");
      return;
    }
    setError("");
    const preview = URL.createObjectURL(file);
    if (type === "story") {
      setStoryAttachment(file);
      setStoryPreview(preview);
    } else {
      setAttachment(file);
      setAttachmentPreview(preview);
    }
  };

  const publishPost = async (event) => {
    event.preventDefault();
    if (!draft.trim() && !attachment) {
      setError("Escreve algo ou adiciona uma foto/vídeo.");
      return;
    }
    setPosting(true);
    setError("");
    try {
      let media = null;
      if (attachment) media = await socialApi.upload(attachment);
      const response = await socialApi.createPost({
        texto: draft.trim(),
        localizacao: location.trim(),
        media_url: media?.url || null,
        media_type: media?.type || null,
        media_blurhash: media?.blurHash || null,
      });
      setPosts((current) => [response.item, ...current.filter((post) => post.id !== response.item.id)]);
      setMyStats((current) => current ? { ...current, publicacoes: current.publicacoes + 1 } : current);
      setDraft("");
      setLocation("");
      setAttachment(null);
      setAttachmentPreview("");
      if (attachmentRef.current) attachmentRef.current.value = "";
      if (section !== "home") setSection("home");
      setFeedMode("for-you");
      showNotice("Publicação partilhada com sucesso.");
    } catch (reason) {
      showError(reason);
    } finally {
      setPosting(false);
    }
  };

  const publishStory = async (event) => {
    event.preventDefault();
    if (!storyDraft.trim() && !storyAttachment) {
      setError("Escreve algo ou adiciona uma foto/vídeo ao story.");
      return;
    }
    setPosting(true);
    setError("");
    try {
      let media = null;
      if (storyAttachment) media = await socialApi.upload(storyAttachment);
      await socialApi.createStory({
        texto: storyDraft.trim(),
        media_url: media?.url || null,
        media_type: media?.type || null,
        media_blurhash: media?.blurHash || null,
      });
      setStoryDraft("");
      setStoryAttachment(null);
      setStoryPreview("");
      setStoryComposer(false);
      if (storyAttachmentRef.current) storyAttachmentRef.current.value = "";
      await loadStoriesAndUsers();
      showNotice("Story publicado. Fica disponível por 24 horas.");
    } catch (reason) {
      showError(reason);
    } finally {
      setPosting(false);
    }
  };

  const openStory = useCallback((story) => {
    setActiveStory(story);
    setError("");
    socialApi.viewStory(story.id)
      .then(() => setStories((current) => current.map((item) => item.id === story.id ? { ...item, visto: true } : item)))
      .catch(showError);
  }, [showError]);

  const moveStory = useCallback((direction) => {
    if (!activeStory) return;
    const index = stories.findIndex((story) => story.id === activeStory.id);
    const next = stories[index + direction];
    if (next) openStory(next);
    else setActiveStory(null);
  }, [activeStory, openStory, stories]);

  useEffect(() => {
    if (!activeStory) return undefined;
    const timer = setTimeout(() => moveStory(1), 6500);
    const handleKey = (event) => {
      if (event.key === "Escape") setActiveStory(null);
      if (event.key === "ArrowRight") moveStory(1);
      if (event.key === "ArrowLeft") moveStory(-1);
    };
    window.addEventListener("keydown", handleKey);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("keydown", handleKey);
    };
  }, [activeStory, moveStory]);

  const toggleLike = async (post) => {
    setPosts((current) => current.map((item) => item.id === post.id
      ? { ...item, curtido: !item.curtido, curtidas: Math.max(0, item.curtidas + (item.curtido ? -1 : 1)) }
      : item));
    try {
      const response = await socialApi.toggleLike(post.id);
      setPosts((current) => current.map((item) => item.id === post.id
        ? { ...item, curtido: response.curtido, curtidas: response.curtidas }
        : item));
    } catch (reason) {
      setPosts((current) => current.map((item) => item.id === post.id ? post : item));
      showError(reason);
    }
  };

  const toggleBookmark = async (post) => {
    setPosts((current) => current.map((item) => item.id === post.id ? { ...item, guardado: !item.guardado } : item));
    try {
      const response = await socialApi.toggleBookmark(post.id);
      if (section === "saved" && !response.guardado) {
        setPosts((current) => current.filter((item) => item.id !== post.id));
      } else {
        setPosts((current) => current.map((item) => item.id === post.id
          ? { ...item, guardado: response.guardado }
          : item));
      }
    } catch (reason) {
      setPosts((current) => current.map((item) => item.id === post.id ? post : item));
      showError(reason);
    }
  };

  const deletePost = async (post) => {
    if (!window.confirm("Queres apagar esta publicação?")) return;
    try {
      await socialApi.deletePost(post.id);
      setPosts((current) => current.filter((item) => item.id !== post.id));
      setMyStats((current) => current ? { ...current, publicacoes: Math.max(0, current.publicacoes - 1) } : current);
      showNotice("Publicação apagada.");
    } catch (reason) {
      showError(reason);
    }
  };

  const openComments = async (post) => {
    setCommentsPost(post);
    setComments([]);
    try {
      const response = await socialApi.comments(post.id);
      setComments(response.items || []);
    } catch (reason) {
      showError(reason);
    }
  };

  const submitComment = async (event) => {
    event.preventDefault();
    if (!commentsPost || !commentDraft.trim()) return;
    setBusyAction("comment");
    try {
      const response = await socialApi.addComment(commentsPost.id, commentDraft.trim());
      setComments((current) => [...current, response.item]);
      setPosts((current) => current.map((post) => post.id === commentsPost.id
        ? { ...post, comentarios: post.comentarios + 1 }
        : post));
      setCommentDraft("");
    } catch (reason) {
      showError(reason);
    } finally {
      setBusyAction("");
    }
  };

  const deleteComment = async (comment) => {
    if (!commentsPost) return;
    try {
      await socialApi.deleteComment(commentsPost.id, comment.id);
      setComments((current) => current.filter((item) => item.id !== comment.id));
      setPosts((current) => current.map((post) => post.id === commentsPost.id
        ? { ...post, comentarios: Math.max(0, post.comentarios - 1) }
        : post));
    } catch (reason) {
      showError(reason);
    }
  };

  const sharePost = async (post) => {
    const url = `${window.location.origin}${window.location.pathname}#social-post-${post.id}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: "Publicação na Âncora", text: post.texto, url });
      } else if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(`${post.texto}\n${url}`);
        showNotice("Ligação copiada para partilhar.");
      } else {
        throw new Error("Este dispositivo não permite copiar a ligação.");
      }
    } catch (reason) {
      if (reason?.name !== "AbortError") showError(reason);
    }
  };

  const toggleFollow = async (person) => {
    setBusyAction(`follow-${person.id}`);
    try {
      const response = await socialApi.toggleFollow(person.id);
      setPeople((current) => current.map((item) => item.id === person.id
        ? { ...item, seguindo: response.seguindo, seguidores: response.seguidores }
        : item));
      setSelectedProfile((current) => current?.id === person.id
        ? { ...current, seguindo: response.seguindo, eu_sigo: response.seguindo, seguidores: response.seguidores }
        : current);
      setProfileStats((current) => current?.id === person.id
        ? { ...current, eu_sigo: response.seguindo, seguidores: response.seguidores }
        : current);
      setMyStats((current) => current?.id === person.id
        ? { ...current, seguidores: response.seguidores }
        : current);
      setMyStats((current) => current
        ? { ...current, seguindo: Math.max(0, current.seguindo + (response.seguindo ? 1 : -1)) }
        : current);
      showNotice(response.seguindo ? `Agora estás a seguir ${person.nome}.` : `Deixaste de seguir ${person.nome}.`);
    } catch (reason) {
      showError(reason);
    } finally {
      setBusyAction("");
    }
  };

  const deleteStory = async () => {
    if (!activeStory || activeStory.autor.id !== user?.id) return;
    try {
      await socialApi.deleteStory(activeStory.id);
      setStories((current) => current.filter((story) => story.id !== activeStory.id));
      setActiveStory(null);
      showNotice("Story apagado.");
    } catch (reason) {
      showError(reason);
    }
  };

  const trends = useMemo(() => {
    const counts = new Map();
    posts.forEach((post) => {
      (post.texto.match(/#[\p{L}\d_]+/gu) || []).forEach((tag) => {
        const key = tag.toLowerCase();
        counts.set(key, (counts.get(key) || 0) + 1);
      });
    });
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
  }, [posts]);

  const submitSearch = (event) => {
    event.preventDefault();
    setSection("explore");
  };

  const renderStoryBar = (variant = "inline") => {
    const ownStory = stories.find((story) => story.autor.id === user?.id);
    const entries = [
      ...(user ? [{ id: "own", author: user, latest: ownStory, own: true, unseen: false }] : []),
      ...storyGroups
        .filter((group) => group.author.id !== user?.id)
        .map((group) => ({
          id: group.author.id,
          author: group.author,
          latest: group.items[group.items.length - 1],
          own: false,
          unseen: group.items.some((story) => !story.visto),
        })),
    ];

    return (
      <section className={`social-card social-stories social-stories-${variant}`} aria-label="Stories">
        {variant === "rail" && (
          <header className="social-stories-heading">
            <div><p>EM DIRETO · ÂNCORA</p><h2>Stories</h2></div>
            <button type="button" onClick={() => setStoryComposer(true)} aria-label="Criar story"><Icon name="plus" size={17} /></button>
          </header>
        )}
        <div className={variant === "rail" ? "social-stories-list" : "social-stories-scroll"}>
          {entries.map((entry) => (
            <button
              key={entry.id}
              className={`social-story-item${variant === "rail" ? " social-story-item-rail" : ""}`}
              type="button"
              onClick={() => {
                if (entry.latest) openStory(entry.latest);
                else setStoryComposer(true);
              }}
            >
              <span className={`social-story-ring${entry.own ? " own" : entry.unseen ? " unseen" : " seen"}`}>
                <Avatar user={entry.author} size={variant === "rail" ? 36 : 58} backend={backend} />
                {entry.own && <span className="social-story-add"><Icon name="plus" size={14} /></span>}
              </span>
              {variant === "rail" ? (
                <span className="social-story-copy">
                  <strong>{entry.own ? "O teu story" : entry.author.nome}</strong>
                  <small>{entry.latest ? timeAgo(entry.latest.criado_em) : "Partilha um momento"}</small>
                </span>
              ) : (
                <span className="social-story-name">{entry.own ? "O teu story" : entry.author.nome.split(" ")[0]}</span>
              )}
              {variant === "rail" && <Icon name="arrow" size={15} />}
            </button>
          ))}
          {!entries.length && <p className="social-muted">Ainda não há stories. Partilha o primeiro.</p>}
        </div>
      </section>
    );
  };

  const renderComposer = () => (
    <form className="social-card social-composer" onSubmit={publishPost}>
      <div className="social-composer-top">
        <Avatar user={user} backend={backend} />
        <textarea
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder={`Em que estás a pensar, ${user?.nome?.split(" ")[0] || "amigo"}?`}
          maxLength={3000}
          rows={3}
          aria-label="Texto da publicação"
        />
      </div>
      {attachmentPreview && (
        <div className="social-attachment-preview">
          {attachment?.type.startsWith("video/")
            ? <video src={attachmentPreview} controls />
            : <img src={attachmentPreview} alt="Pré-visualização da publicação" />}
          <button type="button" onClick={() => { setAttachment(null); setAttachmentPreview(""); }} aria-label="Remover ficheiro">
            <Icon name="close" size={17} />
          </button>
        </div>
      )}
      <div className="social-composer-bottom">
        <div className="social-composer-tools">
          <button type="button" onClick={() => attachmentRef.current?.click()}><Icon name="image" /> Foto/vídeo</button>
          <label className="social-location-input"><Icon name="pin" size={17} /><input value={location} onChange={(event) => setLocation(event.target.value)} maxLength={120} placeholder="Localização" /></label>
          <input ref={attachmentRef} type="file" accept="image/*,video/*" hidden onChange={(event) => selectFile(event.target.files?.[0], "post")} />
        </div>
        <button className="social-primary-button" type="submit" disabled={posting}>
          {posting ? "A publicar..." : "Publicar"}
        </button>
      </div>
      <div className="social-character-count">{draft.length}/3000</div>
    </form>
  );

  const renderPost = (post) => {
    const isOwnPost = post.autor.id === user?.id;
    return (
      <article className="social-card social-post" id={`social-post-${post.id}`} key={post.id}>
        {post.media_url && (
          <div className="social-post-media" onDoubleClick={() => void toggleLike(post)}>
            {post.media_type === "video"
              ? <video src={post.media_url} controls preload="metadata" />
              : <CachedImage src={post.media_url} alt={`Publicação de ${post.autor.nome}`} blurHash={post.media_blurhash} loading="lazy" />}
            {post.localizacao && (
              <span className="social-post-location"><Icon name="pin" size={13} />{post.localizacao}</span>
            )}
          </div>
        )}
        <header className="social-post-header">
          <button className="social-user-link" type="button" onClick={() => openProfile(post.autor)}>
            <Avatar user={post.autor} backend={backend} />
            <span>
              <strong>{post.autor.nome}</strong>
              <small>{[post.localizacao, timeAgo(post.criado_em)].filter(Boolean).join(" · ")}</small>
            </span>
          </button>
          {isOwnPost && (
            <button className="social-icon-button danger-hover" type="button" onClick={() => void deletePost(post)} aria-label="Apagar publicação">
              <Icon name="trash" size={18} />
            </button>
          )}
        </header>
        {post.texto && <p className="social-post-text">{post.texto}</p>}
        <div className="social-post-actions">
          <button className={post.curtido ? "is-liked" : ""} type="button" onClick={() => void toggleLike(post)} aria-label={post.curtido ? "Remover gosto" : "Gostar da publicação"} aria-pressed={post.curtido}>
            <Icon name="heart" fill={post.curtido ? "currentColor" : "none"} /><span>{post.curtidas}</span><span className="social-action-label">Gostos</span>
          </button>
          <button type="button" onClick={() => void openComments(post)} aria-label={`Comentar publicação; ${post.comentarios} comentários`}>
            <Icon name="message" /><span>{post.comentarios}</span><span className="social-action-label">Comentários</span>
          </button>
          <button type="button" onClick={() => void sharePost(post)} aria-label="Partilhar publicação">
            <Icon name="share" /><span className="social-action-label">Partilhar</span>
          </button>
          <button className={`social-save-action${post.guardado ? " is-saved" : ""}`} type="button" onClick={() => void toggleBookmark(post)} aria-label={post.guardado ? "Remover dos guardados" : "Guardar publicação"} aria-pressed={post.guardado}>
            <Icon name="bookmark" fill={post.guardado ? "currentColor" : "none"} />
          </button>
        </div>
      </article>
    );
  };

  const renderLeftRail = () => {
    const galleryPosts = posts.filter((post) => post.autor.id === user?.id && post.media_url && post.media_type !== "video").slice(0, 9);
    return (
      <aside className="social-left-rail">
        {user && (
          <section className="social-editorial-profile">
            <button className="social-editorial-profile-user" type="button" onClick={() => openProfile(user)}>
              <Avatar user={user} size={72} backend={backend} />
              <span className="social-editorial-kicker">PERFIL · COMUNIDADE ÂNCORA</span>
              <strong>{user.nome}</strong>
              <small>{user.provincia || user.pais || "Membro da comunidade"}</small>
            </button>
            <div className="social-editorial-stats">
              <span><b>{myStats?.publicacoes || 0}</b><small>Publicações</small></span>
              <span><b>{myStats?.seguidores || 0}</b><small>Seguidores</small></span>
              <span><b>{myStats?.seguindo || 0}</b><small>A seguir</small></span>
            </div>
            <div className="social-editorial-gallery">
              <header><span>Arquivo visual</span><button type="button" onClick={() => openProfile(user)}>Ver perfil <Icon name="arrow" size={13} /></button></header>
              {galleryPosts.length ? (
                <div className="social-editorial-gallery-grid">
                  {galleryPosts.map((post) => <CachedImage src={post.media_url} blurHash={post.media_blurhash} alt="" key={post.id} loading="lazy" />)}
                </div>
              ) : (
                <p className="social-muted">As tuas publicações com foto vão aparecer aqui.</p>
              )}
            </div>
          </section>
        )}
        <button className="social-primary-button social-nav-post" type="button" onClick={() => {
          setSection("home");
          window.setTimeout(() => document.querySelector(".social-composer textarea")?.focus(), 0);
        }}>Nova publicação <Icon name="plus" size={16} /></button>
        <button className="social-editorial-archive-link" type="button" onClick={() => chooseSection("saved")}>
          <Icon name="bookmark" size={16} /> Publicações guardadas <Icon name="arrow" size={14} />
        </button>
      </aside>
    );
  };

  const renderRightRail = () => (
    <aside className="social-right-rail">
      {renderStoryBar("rail")}
      <section className="social-widget social-trends-widget">
        <header><strong>Índice · tendências</strong><button type="button" onClick={() => chooseSection("explore")}>Explorar</button></header>
        {trends.length ? trends.map(([tag, count], index) => (
          <button className="social-trend" type="button" key={tag} onClick={() => { setSearch(tag); setSection("explore"); }}>
            <span className="social-trend-index">0{index + 1}</span>
            <span className="social-trend-copy"><small>{count} publicações</small><strong>{tag}</strong></span>
            <Icon name="arrow" size={14} />
          </button>
        )) : <p className="social-muted">As tendências aparecem à medida que a comunidade publica.</p>}
      </section>
      <section className="social-widget social-suggestions-widget">
        <header><strong>Sugestões para ti</strong><button type="button" onClick={() => chooseSection("explore")}>Ver tudo</button></header>
        {people.slice(0, 5).map((person) => (
          <div className="social-suggestion" key={person.id}>
            <button className="social-user-link" type="button" onClick={() => openProfile(person)}>
              <Avatar user={person} size={40} backend={backend} />
              <span><strong>{person.nome}</strong><small>{person.seguidores || 0} seguidores</small></span>
            </button>
            <button className={`social-follow-button${person.seguindo ? " following" : ""}`} type="button" disabled={busyAction === `follow-${person.id}`} onClick={() => void toggleFollow(person)}>
              {person.seguindo ? "A seguir" : "Seguir"}
            </button>
          </div>
        ))}
        {!people.length && <p className="social-muted">Ainda não há sugestões disponíveis.</p>}
      </section>
      <p className="social-footer-note">Âncora · Liga pessoas, ideias e oportunidades.</p>
    </aside>
  );

  const renderProfile = () => {
    if (!activeProfile) return null;
    const profileId = activeProfile.id;
    const isOwnProfile = profileId === user?.id;
    const following = profileStats?.eu_sigo ?? activeProfile.seguindo ?? activeProfile.eu_sigo;
    return (
      <section className="social-profile-page">
        <div className="social-card social-profile-card">
          <div className="social-profile-cover" />
          <div className="social-profile-card-body">
            <Avatar user={activeProfile} size={86} backend={backend} />
            <div className="social-profile-info">
              <h2>{activeProfile.nome}</h2>
              <p>{activeProfile.provincia || activeProfile.pais || "Membro da comunidade Âncora"}</p>
            </div>
            {!isOwnProfile && (
              <button className={`social-primary-button${following ? " is-following" : ""}`} type="button" disabled={busyAction === `follow-${profileId}`} onClick={() => void toggleFollow(activeProfile)}>
                {following ? "A seguir" : "Seguir"}
              </button>
            )}
          </div>
          <div className="social-profile-stats">
            <span><b>{profileStats?.publicacoes ?? posts.length}</b><small>Publicações</small></span>
            <span><b>{profileStats?.seguidores ?? activeProfile.seguidores ?? 0}</b><small>Seguidores</small></span>
            <span><b>{profileStats?.seguindo ?? 0}</b><small>A seguir</small></span>
          </div>
        </div>
        <div className="social-section-heading"><h3>Publicações</h3></div>
        {renderPostList()}
      </section>
    );
  };

  const renderPostList = () => {
    if (loading) return <div className="social-card social-empty">A carregar publicações...</div>;
    if (!posts.length) return (
      <div className="social-card social-empty">
        <strong>{section === "saved" ? "Ainda não guardaste publicações" : "Ainda não há publicações"}</strong>
        <span>{section === "saved" ? "Guarda uma publicação para a encontrares aqui." : "Sê a primeira pessoa a partilhar algo com a comunidade."}</span>
      </div>
    );
    return <div className="social-post-list">{posts.map(renderPost)}</div>;
  };

  const renderActivity = () => (
    <section className="social-card social-activity">
      <div className="social-section-heading"><h2>Notificações</h2><span>Atividade da tua rede</span></div>
      {activity.length ? activity.map((item) => (
        <button className="social-activity-item" type="button" key={item.id} onClick={() => {
          if (item.post_id) {
            setSection("home");
            setFeedMode("for-you");
            setSearch("");
          }
        }}>
          <Avatar user={item.autor} size={42} backend={backend} />
          <span><strong>{item.autor.nome}</strong> {item.texto}<small>{timeAgo(item.criado_em)}</small></span>
        </button>
      )) : <div className="social-empty"><strong>Estás em dia</strong><span>Quando alguém gostar, comentar ou seguir-te, vais ver aqui.</span></div>}
    </section>
  );

  const renderExplore = () => {
    const matchingPeople = people.filter((person) => !search.trim() || person.nome.toLowerCase().includes(search.toLowerCase()));
    return (
      <section className="social-explore">
        <div className="social-section-heading"><h2>Explorar</h2><span>Encontra pessoas e publicações</span></div>
        <div className="social-card social-explore-people">
          <h3>Pessoas</h3>
          {matchingPeople.map((person) => (
            <div className="social-suggestion" key={person.id}>
              <button className="social-user-link" type="button" onClick={() => openProfile(person)}>
                <Avatar user={person} size={42} backend={backend} />
                <span><strong>{person.nome}</strong><small>{person.seguidores || 0} seguidores</small></span>
              </button>
              <button className={`social-follow-button${person.seguindo ? " following" : ""}`} type="button" disabled={busyAction === `follow-${person.id}`} onClick={() => void toggleFollow(person)}>
                {person.seguindo ? "A seguir" : "Seguir"}
              </button>
            </div>
          ))}
          {!matchingPeople.length && <p className="social-muted">Não foram encontrados utilizadores.</p>}
        </div>
        <div className="social-section-heading"><h3>Publicações</h3></div>
        {renderPostList()}
      </section>
    );
  };

  const renderMainContent = () => {
    if (section === "activity") return renderActivity();
    if (section === "profile") return renderProfile();
    if (section === "explore") return renderExplore();
    if (section === "saved") return <section><div className="social-section-heading"><h2>Publicações guardadas</h2></div>{renderPostList()}</section>;
    return (
      <section className="social-feed">
        <header className="social-editorial-heading">
          <div><p>FEED EDITORIAL</p><h1>Hoje <em>na Âncora</em></h1></div>
          <span>COMUNIDADE · {user?.provincia || user?.pais || "ANGOLA"}</span>
        </header>
        {renderStoryBar("inline")}
        {renderComposer()}
        <div className="social-feed-tabs">
          {[
            ["for-you", "Para ti"],
            ["following", "A seguir"],
            ["popular", "Populares"],
          ].map(([mode, label]) => (
            <button type="button" className={feedMode === mode ? "active" : ""} key={mode} onClick={() => setFeedMode(mode)}>{label}</button>
          ))}
        </div>
        {renderPostList()}
      </section>
    );
  };

  return (
    <div className="social-network">
      <header className="social-topbar">
        <button
          className="social-mobile-menu-trigger"
          type="button"
          aria-label={mobileMenuOpen ? "Fechar menu" : "Abrir menu"}
          aria-expanded={mobileMenuOpen}
          aria-controls="social-mobile-menu"
          onClick={() => setMobileMenuOpen((isOpen) => !isOpen)}
        >
          <Icon name={mobileMenuOpen ? "close" : "menu"} />
        </button>
        <button className="social-brand" type="button" onClick={() => chooseSection("home")} aria-label="Âncora, início">
          <img src={LogoAncora} alt="" />
          <span>Âncora</span>
        </button>
        <nav className="social-top-nav" aria-label="Navegação social">
          {TOP_NAV_ITEMS.map((item) => (
            <button
              type="button"
              className={section === item.id ? "active" : ""}
              aria-current={section === item.id ? "page" : undefined}
              key={item.id}
              onClick={() => chooseSection(item.id)}
            >{item.label}</button>
          ))}
        </nav>
        <form className="social-search" onSubmit={submitSearch}>
          <Icon name="search" size={18} />
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Pesquisar pessoas e publicações" aria-label="Pesquisar" />
          {search && <button type="button" onClick={() => setSearch("")} aria-label="Limpar pesquisa"><Icon name="close" size={16} /></button>}
        </form>
        <div className="social-top-actions">
          <button className="social-icon-button" type="button" onClick={() => chooseSection("activity")} aria-label="Notificações"><Icon name="bell" /></button>
          <button className="social-icon-button" type="button" onClick={() => chooseSection("messages")} aria-label="Mensagens"><Icon name="message" /></button>
          <button className="social-top-profile" type="button" onClick={() => openProfile(user)} aria-label="Abrir perfil"><Avatar user={user} size={36} backend={backend} /></button>
        </div>
      </header>

      <div className="social-layout">
        {renderLeftRail()}

        <main className="social-main">
          {error && <div className="social-alert" role="alert"><span>{error}</span><button type="button" onClick={() => setError("")} aria-label="Fechar erro"><Icon name="close" size={16} /></button></div>}
          {section !== "home" && section !== "explore" && section !== "profile" && section !== "saved" && section !== "activity" && (
            <div className="social-section-heading"><h2>Comunidade Âncora</h2></div>
          )}
          {section === "explore" && (
            <div className="social-card social-explore-search">
              <Icon name="search" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Pesquisar publicações por texto ou local" />
            </div>
          )}
          {renderMainContent()}
        </main>

        {renderRightRail()}
      </div>

      {mobileMenuOpen && (
        <div
          className="social-mobile-menu-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setMobileMenuOpen(false);
          }}
        >
          <nav className="social-mobile-menu" id="social-mobile-menu" aria-label="Menu de navegação">
            <header>
              <strong>Menu</strong>
              <button className="social-icon-button" type="button" onClick={() => setMobileMenuOpen(false)} aria-label="Fechar menu">
                <Icon name="close" />
              </button>
            </header>
            {NAV_ITEMS.map((item) => (
              <button
                type="button"
                key={item.id}
                className={section === item.id ? "active" : ""}
                aria-current={section === item.id ? "page" : undefined}
                onClick={() => chooseSection(item.id)}
              >
                <Icon name={item.icon} size={20} />
                <span>{item.label}</span>
              </button>
            ))}
            <button
              className="social-mobile-menu-story"
              type="button"
              onClick={() => {
                chooseSection("home");
                setStoryComposer(true);
              }}
            >
              <Icon name="plus" size={20} />
              <span>Criar story</span>
            </button>
          </nav>
        </div>
      )}

      {notice && <div className="social-toast" role="status">{notice}</div>}

      {storyComposer && (
        <div className="social-modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setStoryComposer(false); }}>
          <form className="social-modal social-story-form" onSubmit={publishStory}>
            <header><div><h2>Novo story</h2><p>O teu story desaparece após 24 horas.</p></div><button type="button" className="social-icon-button" onClick={() => setStoryComposer(false)} aria-label="Fechar"><Icon name="close" /></button></header>
            <textarea value={storyDraft} onChange={(event) => setStoryDraft(event.target.value)} rows={4} maxLength={500} placeholder="Partilha um momento..." />
            {storyPreview && (
              <div className="social-attachment-preview">
                {storyAttachment?.type.startsWith("video/")
                  ? <video src={storyPreview} controls />
                  : <img src={storyPreview} alt="Pré-visualização do story" />}
                <button type="button" onClick={() => { setStoryAttachment(null); setStoryPreview(""); }} aria-label="Remover ficheiro"><Icon name="close" size={17} /></button>
              </div>
            )}
            <div className="social-modal-actions">
              <button className="social-secondary-button" type="button" onClick={() => storyAttachmentRef.current?.click()}><Icon name="image" /> Foto/vídeo</button>
              <input ref={storyAttachmentRef} type="file" accept="image/*,video/*" hidden onChange={(event) => selectFile(event.target.files?.[0], "story")} />
              <button className="social-primary-button" type="submit" disabled={posting}>{posting ? "A publicar..." : "Partilhar story"}</button>
            </div>
          </form>
        </div>
      )}

      {activeStory && (
        <div className="social-story-viewer" role="dialog" aria-modal="true" aria-label={`Story de ${activeStory.autor.nome}`} onClick={(event) => { if (event.target === event.currentTarget) setActiveStory(null); }}>
          <button className="social-story-close" type="button" onClick={() => setActiveStory(null)} aria-label="Fechar story"><Icon name="close" /></button>
          <button className="social-story-prev" type="button" onClick={() => moveStory(-1)} aria-label="Story anterior">‹</button>
          <article className="social-story-card">
            {activeStory.media_url && (activeStory.media_type === "video"
              ? <video src={activeStory.media_url} autoPlay muted playsInline controls onEnded={() => moveStory(1)} />
              : <CachedImage src={activeStory.media_url} alt="" blurHash={activeStory.media_blurhash} />)}
            {!activeStory.media_url && <div className="social-story-text-scene">{activeStory.texto}</div>}
            <div className="social-story-shade" />
            <div className="social-story-progress"><span key={activeStory.id} /></div>
            <header className="social-story-author">
              <Avatar user={activeStory.autor} size={36} backend={backend} />
              <span><strong>{activeStory.autor.nome}</strong><small>{timeAgo(activeStory.criado_em)}</small></span>
              {activeStory.autor.id === user?.id && <button type="button" onClick={() => void deleteStory()} aria-label="Apagar story"><Icon name="trash" size={18} /></button>}
            </header>
            {activeStory.texto && activeStory.media_url && <p className="social-story-caption">{activeStory.texto}</p>}
          </article>
          <button className="social-story-next" type="button" onClick={() => moveStory(1)} aria-label="Próximo story">›</button>
        </div>
      )}

      {commentsPost && (
        <div className="social-modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setCommentsPost(null); }}>
          <section className="social-modal social-comments-modal" role="dialog" aria-modal="true" aria-label="Comentários da publicação">
            <header><div><h2>Comentários</h2><p>{commentsPost.autor.nome}</p></div><button type="button" className="social-icon-button" onClick={() => setCommentsPost(null)} aria-label="Fechar"><Icon name="close" /></button></header>
            <div className="social-comments-list">
              {comments.map((comment) => (
                <article className="social-comment" key={comment.id}>
                  <Avatar user={comment.autor} size={36} backend={backend} />
                  <div><strong>{comment.autor.nome}</strong><p>{comment.texto}</p><small>{timeAgo(comment.criado_em)}</small></div>
                  {comment.autor.id === user?.id && <button type="button" onClick={() => void deleteComment(comment)} aria-label="Apagar comentário"><Icon name="trash" size={16} /></button>}
                </article>
              ))}
              {!comments.length && <div className="social-empty"><span>Ainda não há comentários. Sê a primeira pessoa a comentar.</span></div>}
            </div>
            <form className="social-comment-form" onSubmit={submitComment}>
              <Avatar user={user} size={34} backend={backend} />
              <input value={commentDraft} onChange={(event) => setCommentDraft(event.target.value)} maxLength={1000} placeholder="Escreve um comentário..." aria-label="Escreve um comentário" />
              <button type="submit" disabled={busyAction === "comment" || !commentDraft.trim()} aria-label="Enviar comentário"><Icon name="send" size={18} /></button>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}

export default SocialNetwork;
