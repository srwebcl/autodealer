import { connection } from "next/server";
import { db } from "@/lib/db";

const DAY = 86_400_000;

/** Estado básico. No expone versiones, hosts, tokens ni mensajes de error internos. */
export async function GET() {
  await connection(); // siempre en tiempo de solicitud, nunca prerenderizado

  let database: "ok" | "error" = "ok";
  let instagramToken: "ok" | "expiring" | "failing" | "missing" | "unknown" = "unknown";
  try {
    await db.$queryRaw`SELECT 1`;
    // Solo metadatos de la credencial (sin descifrar nada).
    const cred = await db.integrationCredential.findUnique({
      where: { provider: "instagram" },
      select: { expiresAt: true, refreshFailures: true },
    });
    instagramToken = !cred
      ? "missing"
      : cred.refreshFailures > 0
        ? "failing"
        : cred.expiresAt && cred.expiresAt.getTime() - Date.now() < 7 * DAY
          ? "expiring"
          : "ok";
  } catch (error) {
    database = "error";
    console.error("[health] fallo de base de datos:", error instanceof Error ? error.name : "desconocido");
  }

  const healthy = database === "ok" && instagramToken !== "failing" && instagramToken !== "missing";
  return Response.json(
    { status: healthy ? "ok" : "degraded", database, instagramToken },
    { status: database === "ok" ? 200 : 503, headers: { "Cache-Control": "no-store" } },
  );
}
