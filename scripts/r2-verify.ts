/**
 * Verifica R2 sin mostrar claves:
 * 1) configuración válida, 2) la credencial NO puede listar buckets ni escribir en otro bucket,
 * 3) escribe, lee y borra un objeto de prueba en el bucket propio.
 * Las fotos se sirven desde el sitio (/media/...), leyendo R2 de forma privada.
 * Uso: npm run r2:verify
 */
import { existsSync } from "node:fs";
import { randomUUID } from "node:crypto";
import { getR2Env, R2Storage } from "../src/lib/storage/r2";

if (existsSync(".env.local")) process.loadEnvFile(".env.local");

async function main() {
  const env = getR2Env();
  const storage = new R2Storage(env);
  console.log(`Bucket: ${env.R2_BUCKET_NAME}`);

  // Alcance de la credencial.
  const list = await storage.canListBuckets();
  console.log(`${list ? "✗" : "✓"} Listar buckets de la cuenta: ${list ? "PERMITIDO (la clave no está limitada al bucket)" : "denegado"}`);
  const other = await storage.canWriteToBucket(`otro-bucket-${randomUUID().slice(0, 8)}`);
  console.log(`${other.allowed ? "✗" : "✓"} Escribir en otro bucket: ${other.allowed ? "PERMITIDO" : `denegado (HTTP ${other.status})`}`);

  // Ciclo completo en el bucket propio con un objeto mínimo.
  const key = `healthcheck/${randomUUID()}.txt`;
  const body = new TextEncoder().encode("autodealer r2 ok");
  await storage.put(key, body, "text/plain");
  console.log("✓ Escritura en el bucket propio");
  const got = await storage.get(key);
  console.log(`${got.ok ? "✓" : "✗"} Lectura vía API S3 (HTTP ${got.status})`);
  await storage.delete(key);
  console.log("✓ Objeto de prueba eliminado");

  if (list || other.allowed) {
    console.log("\n⚠ La credencial tiene más permisos de los necesarios. Crea un token R2 con 'Object Read & Write' solo para este bucket.");
    process.exitCode = 1;
  }
}

main().catch((e) => {
  // Mensajes de getR2Env/aws4fetch no incluyen claves.
  console.error("✗", e instanceof Error ? e.message : e);
  process.exitCode = 1;
});
