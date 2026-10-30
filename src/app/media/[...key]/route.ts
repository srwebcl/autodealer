import { connection } from "next/server";
import { getR2Env, R2Storage } from "@/lib/storage/r2";

/**
 * Sirve las fotos desde el bucket privado de R2 (API S3), sin depender de r2.dev ni de DNS.
 * Las claves son inmutables (incluyen el ID del medio), así que la CDN de Vercel y los
 * navegadores las guardan un año: R2 solo se lee en el primer acceso de cada foto.
 */
const KEY_PATTERN = /^instagram\/\d+\/\d+\.(jpg|png|webp)$/;
const IMMUTABLE = "public, max-age=31536000, s-maxage=31536000, immutable";

export async function GET(request: Request, ctx: RouteContext<"/media/[...key]">) {
  await connection();
  const { key: parts } = await ctx.params;
  const key = parts.join("/");
  if (!KEY_PATTERN.test(key)) return new Response("No encontrado", { status: 404 });

  let storage: R2Storage;
  try {
    storage = new R2Storage(getR2Env());
  } catch (error) {
    console.error("[media] configuración de R2:", error instanceof Error ? error.message : error);
    return new Response("No disponible", { status: 503 });
  }

  const upstream = await storage.get(key, request.headers.get("if-none-match"));
  if (upstream.status === 304) return new Response(null, { status: 304, headers: { "Cache-Control": IMMUTABLE } });
  if (upstream.status === 404) return new Response("No encontrado", { status: 404, headers: { "Cache-Control": "public, max-age=60" } });
  if (!upstream.ok || !upstream.body) {
    console.error("[media] R2 respondió", upstream.status, "para", key);
    return new Response("No disponible", { status: 502 });
  }

  const headers = new Headers({ "Cache-Control": IMMUTABLE, "X-Content-Type-Options": "nosniff" });
  for (const h of ["content-type", "content-length", "etag", "last-modified"]) {
    const v = upstream.headers.get(h);
    if (v) headers.set(h, v);
  }
  return new Response(upstream.body, { status: 200, headers });
}
