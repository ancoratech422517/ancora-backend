import { fetchComAuth } from "../../utils/api";
import { optimizeImage } from "../../utils/imageOptimizer";
import { useUserStore } from "../../useUseSotore";

function offlineCacheKey(path) {
  const userId = useUserStore.getState().dadosUsuario?.id || "anonymous";
  return `ancora-social:${userId}:${path}`;
}

function readOfflineCache(path) {
  try {
    const stored = localStorage.getItem(offlineCacheKey(path));
    return stored ? JSON.parse(stored) : null;
  } catch (error) {
    console.warn("Não foi possível ler o cache local da rede social:", error);
    return null;
  }
}

function writeOfflineCache(path, payload) {
  try {
    const serialized = JSON.stringify(payload);
    if (serialized.length <= 1_500_000) {
      localStorage.setItem(offlineCacheKey(path), serialized);
    }
  } catch (error) {
    console.warn("Não foi possível atualizar o cache local da rede social:", error);
  }
}

async function request(path, options = {}) {
  const backend = useUserStore.getState().urlBancoDeDados;
  const method = (options.method || "GET").toUpperCase();
  const cacheable = method === "GET";
  let response;
  try {
    response = await fetchComAuth(`${backend}/api/social${path}`, {
      ...options,
      headers: {
        ...(options.body && !(options.body instanceof FormData)
          ? { "Content-Type": "application/json" }
          : {}),
        ...options.headers,
      },
    });
  } catch (error) {
    const cached = cacheable ? readOfflineCache(path) : null;
    if (cached && (error instanceof TypeError || !navigator.onLine)) return cached;
    throw error;
  }
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.error || payload.menssagem || "Não foi possível concluir a operação.");
  }
  if (cacheable) writeOfflineCache(path, payload);
  return payload;
}

export const socialApi = {
  posts: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/posts${query ? `?${query}` : ""}`);
  },
  createPost: (data) => request("/posts", { method: "POST", body: JSON.stringify(data) }),
  deletePost: (id) => request(`/posts/${id}`, { method: "DELETE" }),
  toggleLike: (id) => request(`/posts/${id}/like`, { method: "POST" }),
  toggleBookmark: (id) => request(`/posts/${id}/bookmark`, { method: "POST" }),
  comments: (id) => request(`/posts/${id}/comments`),
  addComment: (id, texto) => request(`/posts/${id}/comments`, {
    method: "POST",
    body: JSON.stringify({ texto }),
  }),
  deleteComment: (postId, commentId) => request(`/posts/${postId}/comments/${commentId}`, { method: "DELETE" }),
  users: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/users${query ? `?${query}` : ""}`);
  },
  profile: (id) => request(`/users/${id}`),
  toggleFollow: (id) => request(`/users/${id}/follow`, { method: "POST" }),
  stories: () => request("/stories"),
  createStory: (data) => request("/stories", { method: "POST", body: JSON.stringify(data) }),
  viewStory: (id) => request(`/stories/${id}/view`, { method: "POST" }),
  deleteStory: (id) => request(`/stories/${id}`, { method: "DELETE" }),
  activity: () => request("/activity"),
  upload: async (file, preset = "feed") => {
    const backend = useUserStore.getState().urlBancoDeDados;
    const optimized = file.type.startsWith("image/")
      ? await optimizeImage(file, preset)
      : { file, blurHash: null };
    const formData = new FormData();
    formData.append("file", optimized.file);
    let response;
    try {
      response = await fetchComAuth(`${backend}/api/upload-file`, {
        method: "POST",
        body: formData,
      });
    } catch (error) {
      if (error?.queued && error.queueId) {
        return {
          url: `queued-upload:${error.queueId}`,
          type: file.type.startsWith("video/") ? "video" : "image",
          blurHash: optimized.blurHash,
          queued: true,
        };
      }
      throw error;
    }
    const payload = await response.json().catch(() => ({}));
    if (!response.ok || !payload.file_url) {
      throw new Error(payload.error || "Não foi possível carregar o ficheiro.");
    }
    return {
      url: payload.file_url,
      type: payload.resource_type === "video" ? "video" : "image",
      blurHash: optimized.blurHash,
    };
  },
};
