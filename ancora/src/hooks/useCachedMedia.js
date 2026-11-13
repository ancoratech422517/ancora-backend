import { useEffect, useState } from "react";
import { cacheRemoteMedia } from "../utils/privateMediaStorage";

export default function useCachedMedia(src, category = "image", persistent = false) {
  const [cachedMedia, setCachedMedia] = useState({ source: "", uri: "" });

  useEffect(() => {
    let active = true;
    if (!src?.startsWith("https://")) return () => { active = false; };

    cacheRemoteMedia(src, category, { persistent })
      .then((uri) => {
        if (active && uri) setCachedMedia({ source: src, uri });
      })
      .catch((error) => {
        console.warn("Não foi possível guardar a mídia no armazenamento privado:", error);
      });
    return () => {
      active = false;
    };
  }, [category, persistent, src]);

  return cachedMedia.source === src ? cachedMedia.uri : src;
}
