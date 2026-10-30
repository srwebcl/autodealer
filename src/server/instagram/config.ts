import { z } from "zod";
import { ALLOWED_GRAPH_HOSTS } from "@/lib/instagram/client";
import { DEFAULT_SYNC_OPTIONS, type SyncOptions } from "./sync";

const schema = z.object({
  INSTAGRAM_ACCESS_TOKEN: z.string().min(20, "INSTAGRAM_ACCESS_TOKEN no está definida"),
  INSTAGRAM_USER_ID: z.string().regex(/^\d+$/, "INSTAGRAM_USER_ID debe ser numérico"),
  INSTAGRAM_GRAPH_HOST: z.enum(ALLOWED_GRAPH_HOSTS).default("graph.facebook.com"),
  INSTAGRAM_GRAPH_VERSION: z.string().regex(/^v\d+\.\d+$/).default("v26.0"),
  // Obligatoria a propósito: decide desde qué fecha se importan publicaciones.
  INSTAGRAM_SYNC_SINCE: z
    .string({ error: "INSTAGRAM_SYNC_SINCE no está definida (fecha ISO, ej. 2026-09-01)" })
    .regex(/^\d{4}-\d{2}-\d{2}$/, "INSTAGRAM_SYNC_SINCE debe ser AAAA-MM-DD"),
  INSTAGRAM_SYNC_MAX_POSTS: z.coerce.number().int().min(1).max(50).optional(),
  // Opcional a propósito: si falta, nada se publica automáticamente (todo queda como borrador).
  INSTAGRAM_AUTO_PUBLISH_SINCE: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "INSTAGRAM_AUTO_PUBLISH_SINCE debe ser AAAA-MM-DD")
    .optional()
    .or(z.literal("").transform(() => undefined)),
});

export type InstagramConfig = z.infer<typeof schema>;

export function getInstagramConfig(source: Record<string, string | undefined> = process.env): InstagramConfig {
  const r = schema.safeParse(source);
  if (!r.success) {
    throw new Error(`Configuración de Instagram inválida: ${r.error.issues.map((i) => i.message).join("; ")}`);
  }
  return r.data;
}

export function syncOptionsFrom(c: InstagramConfig): SyncOptions {
  return {
    ...DEFAULT_SYNC_OPTIONS,
    since: new Date(`${c.INSTAGRAM_SYNC_SINCE}T00:00:00-03:00`),
    autoPublishSince: c.INSTAGRAM_AUTO_PUBLISH_SINCE ? new Date(`${c.INSTAGRAM_AUTO_PUBLISH_SINCE}T00:00:00-03:00`) : null,
    ...(c.INSTAGRAM_SYNC_MAX_POSTS ? { maxPostsPerRun: c.INSTAGRAM_SYNC_MAX_POSTS } : {}),
    // Dos ausencias seguidas (cron cada hora ≈ 1–2 h) evitan retirar por un fallo puntual.
    withdrawMissing: { afterMisses: 2, maxPerRun: 5 },
  };
}
