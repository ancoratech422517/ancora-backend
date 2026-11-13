import { Capacitor } from "@capacitor/core";
import { FileTransfer } from "@capacitor/file-transfer";
import { Directory, Filesystem } from "@capacitor/filesystem";

const ROOT = "Ancora";
const STORAGE_LAYOUT = [
  `${ROOT}/Media/Ancora_Images`,
  `${ROOT}/Media/Ancora_Videos`,
  `${ROOT}/Media/Ancora_Audio`,
  `${ROOT}/Documents`,
  `${ROOT}/.cache/Media/Ancora_Images`,
  `${ROOT}/.cache/Media/Ancora_Videos`,
  `${ROOT}/.cache/Media/Ancora_Audio`,
];
const CATEGORY_PATHS = {
  image: "Media/Ancora_Images",
  video: "Media/Ancora_Videos",
  audio: "Media/Ancora_Audio",
  document: "Documents",
};

function stableFileName(url) {
  let hash = 2166136261;
  for (let index = 0; index < url.length; index += 1) {
    hash ^= url.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  const pathname = new URL(url).pathname;
  const extension = pathname.match(/\.([a-z0-9]{2,5})$/i)?.[1]?.toLowerCase() || "bin";
  return `${(hash >>> 0).toString(16)}.${extension}`;
}

export async function preparePrivateMediaStorage() {
  if (!Capacitor.isNativePlatform()) return;

  await Promise.all(STORAGE_LAYOUT.map((path) => Filesystem.mkdir({
    directory: Directory.Data,
    path,
    recursive: true,
  })));
}

export async function cacheRemoteMedia(url, category = "image", { persistent = false } = {}) {
  if (!Capacitor.isNativePlatform() || !url) return null;

  const parsedUrl = new URL(url);
  if (parsedUrl.protocol !== "https:" || !CATEGORY_PATHS[category]) {
    throw new Error("O endereço ou a categoria da mídia não pode ser guardado localmente.");
  }

  const cacheDirectory = persistent ? Directory.Data : Directory.Cache;
  const basePath = persistent
    ? `${ROOT}/${CATEGORY_PATHS[category]}`
    : `${ROOT}/.cache/${CATEGORY_PATHS[category]}`;
  const filePath = `${basePath}/${stableFileName(url)}`;
  await Filesystem.mkdir({ directory: cacheDirectory, path: basePath, recursive: true });

  let fileUri;
  try {
    const existing = await Filesystem.stat({ directory: cacheDirectory, path: filePath });
    if (existing.type === "file") {
      fileUri = await Filesystem.getUri({ directory: cacheDirectory, path: filePath });
    }
  } catch (error) {
    if (!/not found|does not exist|no such file/i.test(String(error?.message || error))) {
      throw error;
    }
  }

  if (!fileUri) {
    const destination = await Filesystem.getUri({ directory: cacheDirectory, path: filePath });
    await FileTransfer.downloadFile({ url, path: destination.uri });
    fileUri = destination;
  }

  return Capacitor.convertFileSrc(fileUri.uri);
}
