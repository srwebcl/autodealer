/**
 * Ruta pública de una foto guardada en R2. Se sirve desde el propio sitio (/media/...),
 * así funciona igual en vercel.app y en el dominio final, sin depender de r2.dev.
 */
export function publicImageUrl(storageKey: string): string | null {
  if (!storageKey) return null;
  return `/media/${storageKey.split("/").map(encodeURIComponent).join("/")}`;
}
