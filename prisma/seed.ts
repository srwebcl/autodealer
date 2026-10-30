import { existsSync } from "node:fs";
import { createPrismaClient } from "../src/lib/db/create-client";
import { requireDatabaseUrl } from "./seed-guard";

/** Datos iniciales: solo la configuración comercial confirmada. El inventario viene de Instagram. */
if (existsSync(".env.local")) process.loadEnvFile(".env.local");
const db = createPrismaClient(requireDatabaseUrl());

async function main() {
  await db.siteSettings.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      businessName: "AutoDealer",
      address: "Avenida Balmaceda 1595, esquina Huanhualí, La Serena",
      phoneDisplay: "+56 9 6754 6248",
      phoneE164: "+56967546248",
      whatsappNumber: "56967546248",
      email: "contacto@autodealer.cl",
      instagramHandle: "@autodealer.cl",
      instagramUrl: "https://www.instagram.com/autodealer.cl/",
      hours: [
        { days: "Lunes a viernes", time: "08:30 a 18:30 hrs." },
        { days: "Sábado", time: "10:00 a 14:00 hrs." },
      ],
      draftFields: [],
    },
  });
  console.log("Seed OK: configuración comercial lista.");
}

main()
  .catch((error) => {
    console.error("Seed falló:", error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
