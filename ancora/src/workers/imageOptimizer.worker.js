import { encode } from "blurhash";

const PRESETS = {
  feed: { maxDimension: 1080, targetBytes: 180 * 1024 },
  chat: { maxDimension: 1080, targetBytes: 120 * 1024 },
  avatar: { maxDimension: 300, targetBytes: 50 * 1024 },
};

self.onmessage = async ({ data }) => {
  try {
    if (typeof OffscreenCanvas === "undefined" || typeof createImageBitmap !== "function") {
      self.postMessage({ fallback: true });
      return;
    }
    const preset = PRESETS[data.preset] || PRESETS.feed;
    const bitmap = await createImageBitmap(data.file);
    const scale = Math.min(1, preset.maxDimension / Math.max(bitmap.width, bitmap.height));
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));
    const canvas = new OffscreenCanvas(width, height);
    const context = canvas.getContext("2d", { willReadFrequently: true });

    if (!context) throw new Error("Não foi possível preparar a imagem para compressão.");
    context.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();

    const pixels = context.getImageData(0, 0, width, height);
    const blurHash = encode(pixels.data, width, height, 4, 3);
    let quality = 0.85;
    let blob = await canvas.convertToBlob({ type: "image/webp", quality });

    while (blob.size > preset.targetBytes && quality > 0.78) {
      quality = Math.max(0.78, quality - 0.02);
      blob = await canvas.convertToBlob({ type: "image/webp", quality });
    }

    if (blob.type !== "image/webp") {
      throw new Error("Este dispositivo não suporta a conversão de imagens para WebP.");
    }
    self.postMessage({ blob, blurHash });
  } catch (error) {
    self.postMessage({ error: error instanceof Error ? error.message : "Não foi possível otimizar a imagem." });
  }
};
