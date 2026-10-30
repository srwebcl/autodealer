/**
 * URL pública de un objeto en R2. Devuelve null si R2 aún no está configurado
 * (Fase 5); la UI muestra entonces el placeholder.
 */
export function publicImageUrl(storageKey: string, baseUrl = process.env.R2_PUBLIC_BASE_URL): string | null {
  if (!baseUrl || !storageKey) return null;
  const base = baseUrl.replace(/\/+$/, "");
  const key = storageKey.split("/").map(encodeURIComponent).join("/");
  return `${base}/${key}`;
}
