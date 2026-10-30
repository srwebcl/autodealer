import { existsSync } from "node:fs";
import { createPrismaClient } from "../src/lib/db/create-client";
import { demoVehicles } from "./demo-data";
import { assertSafeToSeed, requireDatabaseUrl } from "./seed-guard";

if (existsSync(".env.local")) process.loadEnvFile(".env.local");
assertSafeToSeed();

const db = createPrismaClient(requireDatabaseUrl());

async function main() {
  // Datos comerciales confirmados (sitio anterior y publicaciones de Instagram).
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

  const baseDate = new Date("2026-10-01T12:00:00Z").getTime();
  let published = 0;

  for (const [index, vehicle] of demoVehicles.entries()) {
    // Regla de publicación: precio y año obligatorios.
    const canPublish = vehicle.priceClp != null && vehicle.year != null;
    const publishedAt = canPublish ? new Date(baseDate + index * 86_400_000) : null;
    if (canPublish) published++;

    const data = { ...vehicle, isDemo: true, source: "MANUAL" as const, published: canPublish, publishedAt };
    await db.vehicle.upsert({ where: { slug: vehicle.slug }, update: data, create: data });
  }

  const total = await db.vehicle.count({ where: { isDemo: true } });
  console.log(`Seed OK: ${total} vehículos demo (${published} publicados), configuración comercial lista.`);
}

main()
  .catch((error) => {
    console.error("Seed falló:", error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
