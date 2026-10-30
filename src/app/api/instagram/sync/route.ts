import { timingSafeEqual } from "node:crypto";
import { revalidateTag } from "next/cache";
import { connection } from "next/server";
import { db } from "@/lib/db";
import { createSyncSetup } from "@/server/instagram/setup";
import { runSync } from "@/server/instagram/sync";
import { VEHICLES_TAG } from "@/server/vehicles/queries";

// La sincronización descarga imágenes: margen amplio (Vercel Pro).
export const maxDuration = 300;

function authorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret || secret.length < 16) return false;
  const header = request.headers.get("authorization") ?? "";
  const expected = Buffer.from(`Bearer ${secret}`);
  const received = Buffer.from(header);
  return received.length === expected.length && timingSafeEqual(received, expected);
}

async function handle(request: Request, trigger: "CRON" | "MANUAL") {
  await connection();
  if (!authorized(request)) return Response.json({ error: "No autorizado" }, { status: 401 });

  let setup: ReturnType<typeof createSyncSetup>;
  try {
    setup = createSyncSetup(db);
  } catch (error) {
    // Mensaje solo con nombres de variables.
    console.error("[instagram-sync] configuración:", error instanceof Error ? error.message : error);
    return Response.json({ error: "Sincronización no configurada" }, { status: 503 });
  }

  const result = await runSync(setup.deps, trigger, setup.options);
  if (result.status === "locked") {
    return Response.json({ status: "locked", message: "Ya hay una sincronización en curso" }, { status: 409 });
  }
  if (result.changed) revalidateTag(VEHICLES_TAG, "max");

  console.info("[instagram-sync]", trigger, result.status, JSON.stringify(result.stats));
  return Response.json(
    { status: result.status, runId: result.runId, stats: result.stats, error: result.error },
    { status: result.status === "FAILED" ? 502 : 200, headers: { "Cache-Control": "no-store" } },
  );
}

/** Vercel Cron (GET con Authorization: Bearer CRON_SECRET). */
export function GET(request: Request) {
  return handle(request, request.headers.get("x-vercel-cron-schedule") ? "CRON" : "MANUAL");
}

/** Sincronización manual: curl -X POST -H "Authorization: Bearer $CRON_SECRET" …/api/instagram/sync */
export function POST(request: Request) {
  return handle(request, "MANUAL");
}
