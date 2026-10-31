/**
 * Lista las solicitudes recientes de los formularios (hasta que exista el panel).
 * Uso: npm run leads:list -- [--dias=7]
 */
import { existsSync } from "node:fs";
import { createPrismaClient } from "../src/lib/db/create-client";
import { formatChileanPhone } from "../src/lib/leads/schema";

if (existsSync(".env.local")) process.loadEnvFile(".env.local");
const db = createPrismaClient(process.env.DATABASE_URL ?? "");
const TYPE_LABELS = { FINANCING: "Financiamiento", INSURANCE: "Seguro", SELL: "Vende su auto", CONTACT: "Contacto" } as const;
const days = Number(process.argv.find((a) => a.startsWith("--dias="))?.slice(7) ?? 30);

async function main() {
  const since = new Date(Date.now() - days * 86_400_000);
  const leads = await db.lead.findMany({ where: { createdAt: { gte: since } }, orderBy: { createdAt: "desc" } });
  if (!leads.length) return console.log(`Sin solicitudes en los últimos ${days} días.`);
  console.table(
    leads.map((l) => ({
      fecha: l.createdAt.toLocaleString("es-CL", { timeZone: "America/Santiago" }),
      tipo: TYPE_LABELS[l.type],
      estado: l.status,
      nombre: l.name,
      telefono: formatChileanPhone(l.phone),
      email: l.email ?? "",
      detalle: Object.entries(l.details as Record<string, unknown>)
        .map(([k, v]) => `${k}: ${v}`)
        .join(" · "),
    })),
  );
}

main()
  .catch((e) => {
    console.error("✗", e instanceof Error ? e.message : e);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
