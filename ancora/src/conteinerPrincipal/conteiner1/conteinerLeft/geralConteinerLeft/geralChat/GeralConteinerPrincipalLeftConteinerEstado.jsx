import { useCallback, useEffect, useMemo, useState } from "react";
import "../css/GeralConteinerPrincipalLeftConteinerEstado.css";
import { useUserStore } from "../../../../../useUseSotore";
import Perfil from "../../../../../assets/img_fundo_vazio/perfil.png";
import LogoAncora from "../../../../../assets/logo_preto1.png";
import CachedImage from "../../../../../components/CachedImage";
import { GeralChatMenuButtomBuscarDadosEstado } from "../js/geralChatMenuBoxButtom";

const STATUS_FILTERS = [
    { id: "all", label: "Todos" },
    { id: "unseen", label: "Não vistos" },
    { id: "imagem", label: "Fotos" },
    { id: "video", label: "Vídeos" },
    { id: "texto", label: "Textos" },
    { id: "musica", label: "Música" },
];

const STATUS_LABELS = {
    imagem: "Imagem",
    video: "Vídeo",
    texto: "Texto",
    musica: "Música",
};

function readViewedStatusIds(storageKey) {
    if (typeof window === "undefined") return new Set();
    try {
        const saved = JSON.parse(window.localStorage.getItem(storageKey) || "[]");
        return new Set(Array.isArray(saved) ? saved.map(String) : []);
    } catch (error) {
        console.warn("Não foi possível carregar os estados já vistos:", error);
        return new Set();
    }
}

function getMediaUrl(value, backend, fallback = "") {
    const source = String(value || "").trim();
    if (!source || ["none", "null", "undefined"].includes(source.toLowerCase())) return fallback;
    if (/^(https?:|data:|blob:)/i.test(source)) return source;
    if (source.startsWith("//")) return `${window.location.protocol}${source}`;
    const base = String(backend || "").replace(/\/+$/, "");
    return `${base}/${source.replace(/^\/+/, "")}`;
}

function getStatusType(status) {
    const type = String(status?.tipo_estado || "").toLowerCase();
    return STATUS_LABELS[type] ? type : "texto";
}

export default function GeralConteinerPrincipalLeftConteinerEstado({ setViewChat }) {
    const {
        set_CONDICACAOMOSTRARESTADOETRURMAVIEWS,
        set_CONFIRMARSAIDA,
        set_DADOSTIPOVIEWSLAYUTELEFT,
        DADOSESTADOAMIGO,
        dadosUsuario,
        urlBancoDeDados,
    } = useUserStore();
    const [activeFilter, setActiveFilter] = useState("all");
    const [selectedStatusId, setSelectedStatusId] = useState(null);
    const [progress, setProgress] = useState(0);
    const viewedStorageKey = `ancora-status-viewed-${dadosUsuario?.id || "guest"}`;
    const [viewedStatusIds, setViewedStatusIds] = useState(() => readViewedStatusIds(viewedStorageKey));

    const statuses = useMemo(
        () => (Array.isArray(DADOSESTADOAMIGO) ? [...DADOSESTADOAMIGO] : [])
            .filter((status) => status?.id != null)
            .sort((first, second) => Number(second.id) - Number(first.id)),
        [DADOSESTADOAMIGO],
    );
    const visibleStatuses = useMemo(
        () => statuses.filter((status) => {
            if (activeFilter === "unseen") {
                return !viewedStatusIds.has(String(status.id)) || String(status.id) === selectedStatusId;
            }
            return activeFilter === "all" || getStatusType(status) === activeFilter;
        }),
        [activeFilter, selectedStatusId, statuses, viewedStatusIds],
    );
    const selectedStatus = statuses.find((status) => String(status.id) === selectedStatusId) || null;
    const selectedIndex = visibleStatuses.findIndex((status) => String(status.id) === selectedStatusId);
    const selectedType = selectedStatus ? getStatusType(selectedStatus) : "";

    useEffect(() => {
        try {
            window.localStorage.setItem(viewedStorageKey, JSON.stringify([...viewedStatusIds]));
        } catch (error) {
            console.warn("Não foi possível guardar os estados vistos neste dispositivo:", error);
        }
    }, [viewedStorageKey, viewedStatusIds]);

    const markStatusViewed = useCallback((id) => {
        setViewedStatusIds((previous) => {
            const viewedId = String(id);
            if (previous.has(viewedId)) return previous;
            const next = new Set(previous);
            next.add(viewedId);
            return next;
        });
    }, []);

    const selectStatus = useCallback((status) => {
        setProgress(0);
        setSelectedStatusId(String(status.id));
        markStatusViewed(status.id);
    }, [markStatusViewed]);

    useEffect(() => {
        if (!selectedStatus || selectedType === "video" || selectedType === "musica") return undefined;

        const startedAt = Date.now();
        let advanced = false;
        const timer = window.setInterval(() => {
            const nextProgress = Math.min(((Date.now() - startedAt) / 5000) * 100, 100);
            setProgress(nextProgress);
            if (nextProgress >= 100 && !advanced) {
                advanced = true;
                const nextStatus = visibleStatuses[selectedIndex + 1];
                if (nextStatus) {
                    selectStatus(nextStatus);
                } else {
                    setProgress(0);
                    setSelectedStatusId(null);
                }
            }
        }, 50);

        return () => window.clearInterval(timer);
    }, [selectedIndex, selectedStatus, selectedStatusId, selectedType, selectStatus, visibleStatuses]);

    function changeStatus(offset) {
        const nextStatus = visibleStatuses[selectedIndex + offset];
        if (nextStatus) selectStatus(nextStatus);
    }

    function changeFilter(filter) {
        setActiveFilter(filter);
        setSelectedStatusId(null);
        setProgress(0);
    }

    function openMyStatus() {
        set_CONDICACAOMOSTRARESTADOETRURMAVIEWS(false);
        set_CONFIRMARSAIDA(false);
        set_DADOSTIPOVIEWSLAYUTELEFT(false);
        setViewChat("estado_usuario");
        void GeralChatMenuButtomBuscarDadosEstado();
    }

    function closeStatusPanel() {
        setSelectedStatusId(null);
        setProgress(0);
        set_CONDICACAOMOSTRARESTADOETRURMAVIEWS(false);
    }

    function renderStoryMedia(status) {
        const mediaUrl = getMediaUrl(status.dados_estado, urlBancoDeDados);
        if (selectedType === "imagem") {
            return <CachedImage className="ancoraStatusStoryImage" src={mediaUrl} blurHash={status.media_blurhash} persistent alt={status.descricao_dados || "Estado de um amigo"} />;
        }
        if (selectedType === "video") {
            return (
                <video
                    className="ancoraStatusStoryVideo"
                    src={mediaUrl}
                    controls
                    autoPlay
                    playsInline
                    onTimeUpdate={(event) => {
                        const { currentTime, duration } = event.currentTarget;
                        if (Number.isFinite(duration) && duration > 0) setProgress((currentTime / duration) * 100);
                    }}
                    onEnded={() => changeStatus(1)}
                />
            );
        }
        if (selectedType === "musica") {
            return (
                <div className="ancoraStatusAudio">
                    <img src={getMediaUrl(status.foto_usuario_estado, urlBancoDeDados, Perfil)} alt="" />
                    <span aria-hidden="true">♫</span>
                    <audio
                        src={mediaUrl}
                        controls
                        autoPlay
                        onTimeUpdate={(event) => {
                            const { currentTime, duration } = event.currentTarget;
                            if (Number.isFinite(duration) && duration > 0) setProgress((currentTime / duration) * 100);
                        }}
                        onEnded={() => changeStatus(1)}
                    />
                </div>
            );
        }
        return (
            <div className="ancoraStatusText">
                <p>{status.dados_estado}</p>
            </div>
        );
    }

    const currentUserImage = getMediaUrl(dadosUsuario?.foto_usuario, urlBancoDeDados, Perfil);

    return (
        <div className={`ancoraStatusPanel${selectedStatus ? " isViewing" : ""}`}>
            <aside className="ancoraStatusSidebar">
                <header className="ancoraStatusHeader">
                    <button className="ancoraStatusBack" type="button" onClick={closeStatusPanel} aria-label="Voltar">
                        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m15 18-6-6 6-6" /></svg>
                    </button>
                    <div className="ancoraStatusBrand">
                        <span className="ancoraStatusBrandIcon">
                            <img src={LogoAncora} alt="Logótipo da Âncora" />
                        </span>
                        <div>
                            <strong>ÂNCORA STATUS</strong>
                            <small>ESTADOS DOS AMIGOS</small>
                        </div>
                    </div>
                    <button className="ancoraStatusClose" type="button" onClick={closeStatusPanel} aria-label="Fechar estados">×</button>
                </header>

                <nav className="ancoraStatusFilters" aria-label="Filtrar estados">
                    {STATUS_FILTERS.map((filter) => (
                        <button
                            key={filter.id}
                            type="button"
                            className={activeFilter === filter.id ? "isActive" : ""}
                            onClick={() => changeFilter(filter.id)}
                        >
                            {filter.label}
                        </button>
                    ))}
                </nav>

                <div className="ancoraStatusList">
                    <button className="ancoraStatusMine" type="button" onClick={openMyStatus}>
                        <span className="ancoraStatusAvatarWrap isMine">
                            <img src={currentUserImage} alt="" />
                            <span className="ancoraStatusAdd">+</span>
                        </span>
                        <span className="ancoraStatusMineCopy">
                            <strong>O meu estado</strong>
                            <small>Adicionar uma atualização</small>
                        </span>
                    </button>

                    <div className="ancoraStatusListHeading">
                        <span>ATUALIZAÇÕES RECENTES</span>
                        <span>{visibleStatuses.length}</span>
                    </div>

                    {visibleStatuses.length ? visibleStatuses.map((status) => {
                        const id = String(status.id);
                        const viewed = viewedStatusIds.has(id);
                        const type = getStatusType(status);
                        return (
                            <button
                                key={id}
                                type="button"
                                className={`ancoraStatusFriend${selectedStatusId === id ? " isSelected" : ""}`}
                                onClick={() => selectStatus(status)}
                            >
                                <span className={`ancoraStatusAvatarWrap${viewed ? " isViewed" : ""}`}>
                                    <img
                                        src={getMediaUrl(status.foto_usuario_estado, urlBancoDeDados, Perfil)}
                                        alt=""
                                    />
                                </span>
                                <span className="ancoraStatusFriendCopy">
                                    <strong>{status.nome_usuario_estado || "Amigo"}</strong>
                                    <small>{status.descricao_dados && status.descricao_dados !== "none"
                                        ? status.descricao_dados
                                        : `Partilhou um estado de ${STATUS_LABELS[type].toLowerCase()}`}
                                    </small>
                                </span>
                                <span className="ancoraStatusType">{STATUS_LABELS[type]}</span>
                            </button>
                        );
                    }) : (
                        <div className="ancoraStatusEmptyList">
                            <span aria-hidden="true">◉</span>
                            <strong>Nenhum estado encontrado</strong>
                            <small>Quando os teus amigos partilharem estados, eles vão aparecer aqui.</small>
                        </div>
                    )}
                </div>

                <div className="ancoraStatusTip">
                    <span aria-hidden="true">✦</span>
                    <div>
                        <strong>Fica por dentro</strong>
                        <p>Abre um estado para o ver. O anel Âncora indica as atualizações que ainda não viste neste dispositivo.</p>
                    </div>
                </div>
            </aside>

            <main className="ancoraStatusMain">
                {selectedStatus ? (
                    <section className="ancoraStatusViewer" aria-label={`Estado de ${selectedStatus.nome_usuario_estado || "um amigo"}`}>
                        <div className="ancoraStatusViewerCard">
                            <div className="ancoraStatusProgress">
                                <span style={{ width: `${progress}%` }} />
                            </div>
                            <header className="ancoraStatusViewerHeader">
                                <img src={getMediaUrl(selectedStatus.foto_usuario_estado, urlBancoDeDados, Perfil)} alt="" />
                                <div>
                                    <strong>{selectedStatus.nome_usuario_estado || "Amigo"}</strong>
                                    <small>{STATUS_LABELS[selectedType]}</small>
                                </div>
                                <button type="button" onClick={() => { setSelectedStatusId(null); setProgress(0); }} aria-label="Fechar visualização">×</button>
                            </header>
                            <div className={`ancoraStatusMedia ancoraStatusMedia-${selectedType}`}>
                                {renderStoryMedia(selectedStatus)}
                            </div>
                            {selectedStatus.descricao_dados && selectedStatus.descricao_dados !== "none" && selectedType !== "texto" && (
                                <p className="ancoraStatusCaption">{selectedStatus.descricao_dados}</p>
                            )}
                            <div className="ancoraStatusViewerControls">
                                <button type="button" onClick={() => changeStatus(-1)} disabled={selectedIndex <= 0} aria-label="Estado anterior">‹</button>
                                <span>{selectedIndex + 1} / {visibleStatuses.length}</span>
                                <button type="button" onClick={() => changeStatus(1)} disabled={selectedIndex < 0 || selectedIndex >= visibleStatuses.length - 1} aria-label="Próximo estado">›</button>
                            </div>
                        </div>
                    </section>
                ) : (
                    <section className="ancoraStatusWelcome">
                        <div className="ancoraStatusWelcomeIcon">◉</div>
                        <span className="ancoraStatusEyebrow">ESTADOS DA TUA REDE</span>
                        <h1>O que há de novo?</h1>
                        <p>Seleciona um estado para o ver em ecrã amplo, acompanhar a atualização e navegar pelas publicações dos teus amigos.</p>
                        {statuses.length > 0 && (
                            <div className="ancoraStatusHighlights">
                                {statuses.slice(0, 3).map((status) => {
                                    const type = getStatusType(status);
                                    return (
                                        <button key={status.id} type="button" onClick={() => selectStatus(status)}>
                                            {type === "imagem" ? (
                                                <img src={getMediaUrl(status.dados_estado, urlBancoDeDados, Perfil)} alt="" />
                                            ) : (
                                                <span className="ancoraStatusHighlightText">
                                                    {type === "musica" ? "♫" : type === "video" ? "▶" : status.dados_estado}
                                                </span>
                                            )}
                                            <span className="ancoraStatusHighlightUser">
                                                <img src={getMediaUrl(status.foto_usuario_estado, urlBancoDeDados, Perfil)} alt="" />
                                                <strong>{status.nome_usuario_estado || "Amigo"}</strong>
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </section>
                )}
            </main>
        </div>
    );
}
