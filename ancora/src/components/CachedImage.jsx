import { useMemo } from "react";
import { decode } from "blurhash";
import useCachedMedia from "../hooks/useCachedMedia";

function blurHashDataUrl(hash) {
  if (!hash) return undefined;
  try {
    const pixels = decode(hash, 24, 24);
    const canvas = document.createElement("canvas");
    canvas.width = 24;
    canvas.height = 24;
    const context = canvas.getContext("2d");
    if (!context) return undefined;
    context.putImageData(new ImageData(pixels, 24, 24), 0, 0);
    return canvas.toDataURL();
  } catch (error) {
    console.warn("Não foi possível descodificar o BlurHash da imagem:", error);
    return undefined;
  }
}

export default function CachedImage({ src, alt = "", blurHash, category = "image", persistent = false, ...props }) {
  const imageSrc = useCachedMedia(src, category, persistent);
  const placeholder = useMemo(() => blurHashDataUrl(blurHash), [blurHash]);

  return (
    <img
      {...props}
      src={imageSrc}
      alt={alt}
      style={{
        ...props.style,
        backgroundImage: placeholder ? `url("${placeholder}")` : props.style?.backgroundImage,
        backgroundSize: "cover",
      }}
    />
  );
}
