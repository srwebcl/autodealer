import { existsSync } from "node:fs";
import { createPrismaClient } from "../src/lib/db/create-client";
import { requireDatabaseUrl } from "./seed-guard";

// Borra SOLO vehículos marcados isDemo (sus imágenes caen en cascada).
if (existsSync(".env.local")) process.loadEnvFile(".env.local");
const db = createPrismaClient(requireDatabaseUrl());

db.vehicle
  .deleteMany({ where: { isDemo: true } })
  .then(({ count }) => console.log(`Eliminados ${count} vehículos demo.`))
  .catch((error) => {
    console.error("Error:", error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
