/**
 * Confirma la disponibilidad de un vehículo importado y lo publica, SOLO si su único
 * bloqueo es "disponibilidad no confirmada" (todos los demás datos ya validados).
 * Registra la acción en AuditLog. Reemplazo temporal hasta el panel (Fase 4).
 * Uso: npm run vehicle:confirm -- --instagram-id=<id> [--dry-run]
 */
import { existsSync } from "node:fs";
import { createPrismaClient } from "../src/lib/db/create-client";

if (existsSync(".env.local")) process.loadEnvFile(".env.local");
const db = createPrismaClient(process.env.DATABASE_URL ?? "");
const id = process.argv.find((a) => a.startsWith("--instagram-id="))?.slice(15) ?? "";
const dryRun = process.argv.includes("--dry-run");

async function main() {
  if (!/^\d+$/.test(id)) throw new Error("Indica --instagram-id=<id numérico>");
  const post = await db.instagramPost.findUnique({ where: { instagramMediaId: id }, include: { vehicle: { include: { images: true } } } });
  if (!post?.vehicle) throw new Error("No hay vehículo importado para esa publicación");
  const v = post.vehicle;
  const blockers = ((v.extraction as { blockers?: string[] } | null)?.blockers ?? []).filter((b) => !b.startsWith("Disponibilidad no confirmada"));
  console.log(`${v.make} ${v.model} ${v.version ?? ""} ${v.year ?? ""} · ${v.images.length} fotos · estado ${v.status} · publicado: ${v.published}`);
  if (v.published) return console.log("Ya está publicado. Nada que hacer.");
  if (blockers.length) throw new Error(`No se publica: ${blockers.join("; ")}`);
  if (v.status !== "AVAILABLE" && v.status !== "RESERVED") throw new Error(`Estado ${v.status}: no se publica`);
  if (dryRun) return console.log("--dry-run: se publicaría. No se hizo ningún cambio.");

  await db.$transaction([
    db.vehicle.update({ where: { id: v.id }, data: { published: true, publishedAt: post.publishedAt ?? new Date() } }),
    db.instagramPost.update({ where: { id: post.id }, data: { syncStatus: "SUCCESS", lastError: null } }),
    db.auditLog.create({
      data: { action: "vehicle.availability_confirmed", entityType: "Vehicle", entityId: v.id, details: { instagramMediaId: id, via: "script" } },
    }),
  ]);
  console.log(`✓ Publicado: /vehiculos/${v.slug}`);
}

main()
  .catch((e) => {
    console.error("✗", e instanceof Error ? e.message : e);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
