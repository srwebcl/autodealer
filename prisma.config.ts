import { existsSync } from "node:fs";
import { defineConfig } from "prisma/config";

// Prisma 7 no carga archivos .env por su cuenta. En local se usa .env.local;
// en Vercel las variables vienen del entorno del proyecto.
if (existsSync(".env.local")) process.loadEnvFile(".env.local");

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    // El CLI (migraciones) usa la conexión directa, sin pooler.
    url: process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL,
  },
});
