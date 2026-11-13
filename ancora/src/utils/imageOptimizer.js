import { encode } from "blurhash";

const PRESETS = {
  feed: { maxDimension: 1080, targetBytes: 180 * 1024 },
  chat: { maxDimension: 1080, targetBytes: 120 * 1024 },
  avatar: { maxDimension: 300, targetBytes: 50 * 1024 },
};

function isPassThroughImage(file) {
  const name = file.name.toLowerCase();
  return ["image/svg+xml", "image/gif", "image/webp", "image/avif", "image/apng"].includes(file.type.toLowerCase())
    || /\.(svg|gif|webp|avif|apng)$/i.test(name);
}

function optimizedName(name) {
  const base = name.replace(/\.[^.]+$/, "") || "imagem";
  return `${base}.webp`;
}

async function optimizeOnMainThread(file, presetName) {
  const preset = PRESETS[presetName] || PRESETS.feed;
  const image = typeof createImageBitmap === "function"
    ? await createImageBitmap(file)
    : await loadImage(file);
  const scale = Math.min(1, preset.maxDimension / Math.max(image.width, image.height));
  const width = Math.max(1, Math.round(image.width * scale));
  const height = Math.max(1, Math.round(image.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d", { willReadFrequently: true });

  if (!context) {
    image.close?.();
    throw new Error("Não foi possível preparar a imagem para compressão.");
  }
  context.drawImage(image, 0, 0, width, height);
  image.close?.();

  const pixels = context.getImageData(0, 0, width, height);
  const blurHash = encode(pixels.data, width, height, 4, 3);
  const toWebp = (quality) => new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("Não foi possível codificar a imagem."));
    }, "image/webp", quality);
  });

  let quality = 0.85;
  let blob = await toWebp(quality);
  while (blob.size > preset.targetBytes && quality > 0.78) {
    quality = Math.max(0.78, quality - 0.02);
    blob = await toWebp(quality);
  }
  if (blob.type !== "image/webp") {
    throw new Error("Este dispositivo não suporta a conversão de imagens para WebP.");
  }
  return { file: new File([blob], optimizedName(file.name), { type: "image/webp", lastModified: file.lastModified }), blurHash };
}

function loadImage(file) {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Não foi possível descodificar a imagem selecionada."));
    };
    image.src = objectUrl;
  });
}

export async function optimizeImage(file, presetName = "feed") {
  if (!(file instanceof File) || !file.type.startsWith("image/") || isPassThroughImage(file)) {
    return { file, blurHash: null };
  }

  if (typeof Worker === "undefined") {
    return optimizeOnMainThread(file, presetName);
  }

  let worker;
  try {
    worker = new Worker(new URL("../workers/imageOptimizer.worker.js", import.meta.url), { type: "module" });
  } catch {
    return optimizeOnMainThread(file, presetName);
  }
  try {
    const result = await new Promise((resolve, reject) => {
      worker.onmessage = ({ data }) => {
        if (data.fallback) {
          resolve({ fallback: true });
          return;
        }
        if (data.error) reject(new Error(data.error));
        else resolve(data);
      };
      worker.onerror = () => resolve({ fallback: true });
      worker.postMessage({ file, preset: presetName });
    });
    if (result.fallback) return optimizeOnMainThread(file, presetName);
    return {
      file: new File([result.blob], optimizedName(file.name), {
        type: "image/webp",
        lastModified: file.lastModified,
      }),
      blurHash: result.blurHash,
    };
  } finally {
    worker.terminate();
  }
}

export async function optimizeFormDataImage(formData, fieldName, presetName = "feed") {
  const file = formData.get(fieldName);
  if (!(file instanceof File) || !file.type.startsWith("image/")) return null;
  const optimized = await optimizeImage(file, presetName);
  formData.set(fieldName, optimized.file, optimized.file.name);
  formData.set(`${fieldName}_blurhash`, optimized.blurHash || "");
  return optimized;
}
