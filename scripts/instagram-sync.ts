/**
 * Ejecuta la sincronización real desde la terminal (escribe en Neon y R2).
 * Uso: npm run ig:sync
 */
import { existsSync } from "node:fs";
import { createPrismaClient } from "../src/lib/db/create-client";
import { createSyncSetup } from "../src/server/instagram/setup";
import { runSync } from "../src/server/instagram/sync";

if (existsSync(".env.local")) process.loadEnvFile(".env.local");
const db = createPrismaClient(process.env.DATABASE_URL ?? "");

async function main() {
  const { deps, options } = createSyncSetup(db);
  console.log(`Sincronizando desde ${options.since.toISOString().slice(0, 10)} (máx. ${options.maxPostsPerRun} por ejecución)…`);
  const r = await runSync(deps, "SCRIPT", options);
  if (r.status === "locked") return console.log("Ya hay una sincronización en curso.");
  console.log(`Estado: ${r.status}`);
  console.table(r.stats);
  if (r.error) console.log(`Error: ${r.error}`);
  console.log("Nota: el sitio en ejecución refresca su caché en ≤1 h (o al sincronizar vía /api/instagram/sync).");
}

main()
  .catch((e) => {
    console.error("✗", e instanceof Error ? e.message : e);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
