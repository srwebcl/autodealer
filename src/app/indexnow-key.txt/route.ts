import { INDEXNOW_KEY } from "@/lib/seo/indexnow";

/** Archivo de verificación de IndexNow: su contenido es la clave. */
export function GET() {
  return new Response(INDEXNOW_KEY, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
