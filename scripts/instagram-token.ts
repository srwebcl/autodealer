/**
 * Estado del token de Instagram (sin secretos) y renovación manual.
 * Uso: npm run ig:token            → estado (solo lectura; no inicializa)
 *      npm run ig:token -- --refresh → renovar ahora con el mecanismo oficial (escribe en Neon)
 */
import { existsSync } from "node:fs";
import { createPrismaClient } from "../src/lib/db/create-client";
import { createTokenManager } from "../src/server/instagram/setup";

if (existsSync(".env.local")) process.loadEnvFile(".env.local");
const db = createPrismaClient(process.env.DATABASE_URL ?? "");
const fmt = (d: Date | null | undefined) => (d ? d.toISOString().replace("T", " ").slice(0, 16) + " UTC" : "—");

async function main() {
  const tokens = createTokenManager(db);
  if (process.argv.includes("--refresh")) {
    const r = await tokens.refreshIfDue({ force: true });
    console.log(r.status === "refreshed" ? `✓ Renovado. Vence ${fmt(r.expiresAt)}` : `✗ ${r.status === "failed" ? r.error : r.status}`);
  }
  const s = await tokens.status();
  if (!s) return console.log("Aún no hay token guardado en Neon: se guardará cifrado en la primera sincronización.");
  console.log(`Guardado:              ${fmt(s.storedAt)}`);
  console.log(`Última renovación:     ${fmt(s.lastRefreshedAt)}`);
  console.log(`Vence:                 ${s.expiresAt ? fmt(s.expiresAt) : "desconocido hasta la primera renovación"}`);
  console.log(`Próxima renovación:    ${fmt(s.nextRefreshAt)}`);
  console.log(`Último intento:        ${fmt(s.lastRefreshAttemptAt)}`);
  console.log(`Fallos consecutivos:   ${s.refreshFailures}${s.lastRefreshError ? ` · último error: ${s.lastRefreshError}` : ""}`);
  console.log(`.env coincide con Neon: ${s.envMatchesStored === null ? "sin token en .env" : s.envMatchesStored ? "sí" : "no (se adoptará el de .env si es válido)"}`);
}

main()
  .catch((e) => {
    console.error("✗", e instanceof Error ? e.message : e);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
