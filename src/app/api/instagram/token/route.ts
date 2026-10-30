import { connection } from "next/server";
import { db } from "@/lib/db";
import { isAuthorizedCron } from "@/lib/security/cron-auth";
import { createTokenManager } from "@/server/instagram/setup";

/**
 * Renovación del token de Instagram, independiente de la sincronización.
 * Vercel Cron la llama a diario; solo contacta a Meta cuando corresponde (24 h tras guardarlo,
 * luego cada 50 días). El token nuevo se valida antes de reemplazar al vigente; si falla,
 * se conserva el vigente y se registra una alerta. La respuesta nunca incluye el token.
 */
export async function GET(request: Request) {
  await connection();
  if (!isAuthorizedCron(request)) return Response.json({ error: "No autorizado" }, { status: 401 });

  let tokens: ReturnType<typeof createTokenManager>;
  try {
    tokens = createTokenManager(db);
  } catch (error) {
    console.error("[instagram-token] configuración:", error instanceof Error ? error.message : error);
    return Response.json({ error: "Renovación no configurada" }, { status: 503 });
  }

  const outcome = await tokens.refreshIfDue();
  const status = await tokens.status();
  console.info("[instagram-token]", outcome.status);
  return Response.json(
    {
      result: outcome.status,
      expiresAt: status?.expiresAt ?? null,
      nextRefreshAt: status?.nextRefreshAt ?? null,
      lastRefreshedAt: status?.lastRefreshedAt ?? null,
      refreshFailures: status?.refreshFailures ?? 0,
    },
    { status: outcome.status === "failed" ? 502 : 200, headers: { "Cache-Control": "no-store" } },
  );
}
