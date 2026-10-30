/**
 * Descarga segura de imágenes de Instagram (anti-SSRF):
 * - solo https y hosts de CDN de Meta, también en cada redirección;
 * - tipo MIME y firma binaria (magic bytes) de imagen;
 * - límite de tamaño aplicado mientras se lee, no solo por Content-Length.
 */

const ALLOWED_HOST_SUFFIXES = [".cdninstagram.com", ".fbcdn.net"];
export const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const MAX_REDIRECTS = 3;

const TYPES = {
  "image/jpeg": { ext: "jpg", magic: (b: Uint8Array) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  "image/png": { ext: "png", magic: (b: Uint8Array) => b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47 },
  "image/webp": {
    ext: "webp",
    magic: (b: Uint8Array) =>
      String.fromCharCode(...b.slice(0, 4)) === "RIFF" && String.fromCharCode(...b.slice(8, 12)) === "WEBP",
  },
} as const;

export type ImageContentType = keyof typeof TYPES;

export class DownloadError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DownloadError";
  }
}

export function isAllowedMediaUrl(raw: string): boolean {
  try {
    const u = new URL(raw);
    return u.protocol === "https:" && !u.username && !u.password && ALLOWED_HOST_SUFFIXES.some((s) => u.hostname.endsWith(s));
  } catch {
    return false;
  }
}

/** Host sin la consulta firmada, para registrar en logs sin exponer la URL temporal. */
export function describeUrl(raw: string): string {
  try {
    return new URL(raw).hostname;
  } catch {
    return "url-inválida";
  }
}

export async function downloadImage(
  rawUrl: string,
  { fetchImpl = fetch, maxBytes = MAX_IMAGE_BYTES, timeoutMs = 20_000 } = {},
): Promise<{ bytes: Uint8Array; contentType: ImageContentType; ext: string }> {
  let url = rawUrl;
  let res: Response | null = null;
  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    if (!isAllowedMediaUrl(url)) throw new DownloadError(`Host no permitido: ${describeUrl(url)}`);
    res = await fetchImpl(url, { redirect: "manual", signal: AbortSignal.timeout(timeoutMs), cache: "no-store" });
    if (res.status >= 300 && res.status < 400) {
      const location = res.headers.get("location");
      if (!location) throw new DownloadError("Redirección sin destino");
      url = new URL(location, url).toString();
      continue;
    }
    break;
  }
  if (!res || (res.status >= 300 && res.status < 400)) throw new DownloadError("Demasiadas redirecciones");
  if (!res.ok) throw new DownloadError(`HTTP ${res.status} al descargar (${describeUrl(url)})`);

  const contentType = (res.headers.get("content-type") ?? "").split(";")[0].trim().toLowerCase() as ImageContentType;
  if (!(contentType in TYPES)) throw new DownloadError(`Tipo no permitido: ${contentType || "desconocido"}`);
  const declared = Number(res.headers.get("content-length") ?? 0);
  if (declared > maxBytes) throw new DownloadError(`Imagen demasiado grande (${declared} bytes)`);
  if (!res.body) throw new DownloadError("Respuesta sin cuerpo");

  const chunks: Uint8Array[] = [];
  let total = 0;
  const reader = res.body.getReader();
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > maxBytes) {
      await reader.cancel();
      throw new DownloadError(`Imagen supera ${maxBytes} bytes`);
    }
    chunks.push(value);
  }
  if (total === 0) throw new DownloadError("Imagen vacía");
  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const c of chunks) {
    bytes.set(c, offset);
    offset += c.byteLength;
  }
  if (!TYPES[contentType].magic(bytes)) throw new DownloadError("El contenido no coincide con el tipo de imagen declarado");
  return { bytes, contentType, ext: TYPES[contentType].ext };
}
