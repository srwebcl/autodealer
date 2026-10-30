/**
 * Vuelve a interpretar captions YA GUARDADOS en Neon (sin llamar a Instagram ni tocar R2)
 * y actualiza los datos derivados del vehículo. Nunca cambia estado, publicación ni fechas,
 * y respeta lockedFields.
 * Uso: npm run ig:reparse -- --only=<id>[,<id>] [--dry-run]
 */
import { existsSync } from "node:fs";
import type { Prisma } from "../src/generated/prisma/client";
import { createPrismaClient } from "../src/lib/db/create-client";
import { parseCaption } from "../src/lib/instagram/parse-caption";
import { vehicleDataFromCaption } from "../src/server/instagram/sync";

if (existsSync(".env.local")) process.loadEnvFile(".env.local");
const db = createPrismaClient(process.env.DATABASE_URL ?? "");
const ids = (process.argv.find((a) => a.startsWith("--only="))?.slice(7) ?? "").split(",").filter((x) => /^\d+$/.test(x));
const dryRun = process.argv.includes("--dry-run");

async function main() {
  if (!ids.length) throw new Error("Indica --only=<id>[,<id>]");
  for (const id of ids) {
    const post = await db.instagramPost.findUnique({ where: { instagramMediaId: id }, include: { vehicle: true } });
    if (!post?.vehicle) {
      console.log(`${id}: sin vehículo importado, se omite`);
      continue;
    }
    const v = post.vehicle;
    const parsed = parseCaption(post.caption);
    const data = vehicleDataFromCaption(post.caption, parsed.vehicle, v.lockedFields);
    const prev = (v.extraction as Record<string, unknown> | null) ?? {};
    const extraction = { ...prev, provenance: parsed.provenance, warnings: parsed.warnings, reparsedAt: new Date().toISOString() };
    const before = { status: v.status, published: v.published, publishedAt: v.publishedAt?.toISOString() };
    if (dryRun) {
      console.log(`${id}: ${v.make} ${v.model} → se actualizarían ${Object.keys(data).length} campos derivados (estado/publicación sin cambios: ${JSON.stringify(before)})`);
      continue;
    }
    await db.$transaction([
      db.vehicle.update({ where: { id: v.id }, data: { ...data, extraction: extraction as unknown as Prisma.InputJsonValue } }),
      db.syncLog.create({ data: { postId: post.id, eventType: "vehicle.reparsed", message: `${v.make} ${v.model}: caption reinterpretado`, details: { fields: Object.keys(data) } } }),
    ]);
    const after = await db.vehicle.findUniqueOrThrow({ where: { id: v.id } });
    const unchanged = after.status === v.status && after.published === v.published && after.publishedAt?.getTime() === v.publishedAt?.getTime();
    console.log(`${id}: ${after.make} ${after.model} actualizado · estado/publicación intactos: ${unchanged ? "sí" : "NO"}`);
  }
}

main()
  .catch((e) => {
    console.error("✗", e instanceof Error ? e.message : e);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
