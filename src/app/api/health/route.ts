import { connection } from "next/server";
import { db } from "@/lib/db";

/** Estado básico. No expone versiones, hosts ni mensajes de error internos. */
export async function GET() {
  await connection(); // siempre en tiempo de solicitud, nunca prerenderizado

  let database: "ok" | "error" = "ok";
  try {
    await db.$queryRaw`SELECT 1`;
  } catch (error) {
    database = "error";
    console.error("[health] fallo de base de datos:", error instanceof Error ? error.name : "desconocido");
  }

  return Response.json(
    { status: database === "ok" ? "ok" : "degraded", database },
    { status: database === "ok" ? 200 : 503, headers: { "Cache-Control": "no-store" } },
  );
}
