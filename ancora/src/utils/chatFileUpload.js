import { fetchComAuth } from "./api";

function detectResourceType(file) {
  const mime = (file.type || "").toLowerCase();
  const name = (file.name || "").toLowerCase();
  if (/\.(gguf|ggml|bin|pt|pth|onnx|safetensors|ckpt|pickle|pkl)$/i.test(name)) return "raw";
  if (mime.startsWith("image/") || /\.(jpe?g|png|gif|webp|bmp|svg|heic|avif)$/i.test(name)) return "image";
  if (mime.startsWith("video/") || mime.startsWith("audio/") || /\.(mp4|webm|mov|avi|mkv|m4v|mp3|wav|ogg|m4a|aac|flac)$/i.test(name)) return "video";
  return "raw";
}

export async function uploadChatFileInChunks(file, { backendUrl, onProgress, onXhr } = {}) {
  const detectedType = detectResourceType(file);
  const signatureResponse = await fetchComAuth(`${backendUrl}/api/create-upload-signature`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      filename: file.name,
      file_size: file.size,
      mime_type: file.type || "application/octet-stream",
      resource_type: detectedType,
    }),
    offlineQueue: false,
  });
  const signatureData = await signatureResponse.json().catch(() => ({}));
  if (!signatureResponse.ok || !signatureData.success) {
    throw new Error(signatureData.error || "Não foi possível iniciar o upload.");
  }

  const required = ["api_key", "timestamp", "signature", "cloud_name", "upload_id", "public_id"];
  for (const key of required) {
    if (!signatureData[key]) throw new Error(`Resposta da assinatura incompleta (falta ${key}).`);
  }

  let chunkSize = Number(signatureData.chunk_size) || 6 * 1024 * 1024;
  if (chunkSize < 5 * 1024 * 1024) chunkSize = 6 * 1024 * 1024;
  const resourceType = signatureData.resource_type || detectedType;
  const uploadUrl = `https://api.cloudinary.com/v1_1/${signatureData.cloud_name}/${resourceType}/upload`;
  let uploadedBytesTotal = 0;
  let uploadResult = null;

  for (let start = 0; start < file.size; start += chunkSize) {
    const end = Math.min(start + chunkSize, file.size);
    const chunk = file.slice(start, end);
    const formData = new FormData();
    formData.append("file", chunk, file.name);
    formData.append("api_key", signatureData.api_key);
    formData.append("timestamp", String(signatureData.timestamp));
    formData.append("signature", signatureData.signature);
    formData.append("folder", signatureData.folder || "");
    formData.append("public_id", signatureData.public_id);
    if (signatureData.upload_preset) formData.append("upload_preset", signatureData.upload_preset);

    uploadResult = await new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      onXhr?.(xhr);
      xhr.open("POST", uploadUrl, true);
      xhr.setRequestHeader("X-Unique-Upload-Id", signatureData.upload_id);
      xhr.setRequestHeader("Content-Range", `bytes ${start}-${end - 1}/${file.size}`);
      xhr.upload.onprogress = (event) => {
        if (!event.lengthComputable) return;
        const chunkLoaded = Math.min(chunk.size, Math.round((event.loaded / event.total) * chunk.size));
        onProgress?.(Math.min(file.size, uploadedBytesTotal + chunkLoaded));
      };
      xhr.onload = () => {
        let result = {};
        try {
          result = JSON.parse(xhr.responseText);
        } catch {
          result = { raw: xhr.responseText };
        }
        if (xhr.status < 200 || xhr.status >= 300 || result.error) {
          reject(new Error(result.error?.message || result.message || `Cloudinary recusou o bloco (${xhr.status})`));
          return;
        }
        resolve(result);
      };
      xhr.onerror = () => reject(new Error("Erro de rede durante o envio de um bloco."));
      xhr.onabort = () => reject(new DOMException("Upload cancelado.", "AbortError"));
      xhr.send(formData);
    });
    uploadedBytesTotal = end;
  }

  if (!(uploadResult?.done === true || uploadResult?.public_id || uploadResult?.secure_url || uploadResult?.url)) {
    throw new Error("Cloudinary não confirmou o último bloco do arquivo.");
  }

  const finalizeResponse = await fetchComAuth(`${backendUrl}/api/finalize-chunked-upload`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      upload_ticket: signatureData.upload_ticket,
      public_id: uploadResult.public_id || signatureData.public_id,
      filename: file.name,
      mime_type: file.type || "application/octet-stream",
      secure_url: uploadResult.secure_url,
      url: uploadResult.url,
      bytes: uploadResult.bytes,
      format: uploadResult.format,
      resource_type: uploadResult.resource_type || resourceType,
    }),
    offlineQueue: false,
  });
  const finalData = await finalizeResponse.json().catch(() => ({}));
  if (!finalizeResponse.ok || !finalData.success) {
    throw new Error(finalData.error || "O backend não confirmou o arquivo no Cloudinary.");
  }
  return {
    ...finalData,
    mime_type: finalData.mime_type || file.type || "application/octet-stream",
    filename: finalData.filename || file.name,
    size: finalData.size || uploadResult.bytes || file.size,
    file_url: finalData.file_url || uploadResult.secure_url || uploadResult.url,
    public_id: finalData.public_id || uploadResult.public_id,
    folder: finalData.folder || signatureData.folder,
    format: finalData.format || uploadResult.format,
    resource_type: finalData.resource_type || uploadResult.resource_type || resourceType,
  };
}
