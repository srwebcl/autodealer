/** Evita sembrar datos ficticios en producción por accidente. */
export function assertSafeToSeed() {
  const isProduction = process.env.VERCEL_ENV === "production" || process.env.NODE_ENV === "production";
  if (isProduction && process.env.ALLOW_DEMO_SEED !== "true") {
    throw new Error("Seed demo bloqueado en producción. Usa ALLOW_DEMO_SEED=true solo si sabes lo que haces.");
  }
}

export function requireDatabaseUrl(): string {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL no está definida (revisa .env.local)");
  return url;
}
