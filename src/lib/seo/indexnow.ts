import { siteConfig } from "@/config/site";
import { absoluteUrl } from "@/lib/seo/urls";

/**
 * IndexNow (Bing, Yandex, Seznam, Naver…; ChatGPT y Copilot buscan en Bing): avisa al instante
 * qué páginas cambiaron, en vez de esperar a que el buscador vuelva a pasar.
 * La clave es pública por diseño (se publica en /indexnow-key.txt para probar que el sitio es nuestro).
 */
export const INDEXNOW_KEY = "491891d396d833457a9af53700059b91";
export const INDEXNOW_KEY_PATH = "/indexnow-key.txt";

export type IndexNowResult = { sent: number; status?: number; skipped?: string };

export async function submitIndexNow(paths: string[], fetchImpl: typeof fetch = fetch): Promise<IndexNowResult> {
  // Solo desde el dominio final e indexable: nunca avisar URLs de vercel.app ni de localhost.
  if (!siteConfig.indexable) return { sent: 0, skipped: "sitio no indexable" };
  const host = new URL(siteConfig.url).host;
  const urlList = [...new Set(paths.map((p) => absoluteUrl(p)))].slice(0, 10_000);
  if (!urlList.length) return { sent: 0, skipped: "sin URLs" };

  const res = await fetchImpl("https://api.indexnow.org/indexnow", {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify({ host, key: INDEXNOW_KEY, keyLocation: absoluteUrl(INDEXNOW_KEY_PATH), urlList }),
    signal: AbortSignal.timeout(10_000),
  });
  return { sent: urlList.length, status: res.status };
}
