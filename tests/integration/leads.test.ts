import { existsSync } from "node:fs";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { createPrismaClient } from "@/lib/db/create-client";
import { parseLead } from "@/lib/leads/schema";
import { createLead, isRateLimited, LEAD_RATE_LIMIT } from "@/server/leads/repository";

if (existsSync(".env.local")) process.loadEnvFile(".env.local");
const url = process.env.DATABASE_URL;
const db = url ? createPrismaClient(url) : null;

// Marca propia: la limpieza solo toca filas de esta prueba.
const IP = "zz-prueba-leads";
const cleanup = () => db?.lead.deleteMany({ where: { ipHash: { startsWith: IP } } });
afterAll(async () => {
  await cleanup();
  await db?.$disconnect();
});

const lead = (form: string, raw: Record<string, string>) => {
  const r = parseLead(form, raw);
  if (!r.ok) throw new Error(JSON.stringify(r.fieldErrors));
  return r.lead;
};

describe.skipIf(!db)("solicitudes (base real, filas de prueba)", () => {
  beforeEach(async () => {
    await cleanup();
  });

  it("guarda financiamiento con datos normalizados y detalles aparte", async () => {
    const { id } = await createLead(db!, lead("financiamiento", { nombre: "Zz Prueba", telefono: "9 1234 5678", vehiculo: "Peugeot Partner 2024", pie: "Sin pie" }), {
      page: "/financiamiento",
      ipHash: `${IP}-a`,
    });
    const row = await db!.lead.findUniqueOrThrow({ where: { id } });
    expect(row).toMatchObject({ type: "FINANCING", status: "NEW", name: "Zz Prueba", phone: "+56912345678", email: null, page: "/financiamiento" });
    expect(row.details).toEqual({ vehiculo: "Peugeot Partner 2024", pie: "Sin pie" });
  });

  it("guarda seguro con patente y año", async () => {
    const { id } = await createLead(db!, lead("seguro", { nombre: "Zz Prueba", telefono: "967546248", vehiculo: "Toyota Hilux", anio: "2020", patente: "bc-df-12" }), {
      ipHash: `${IP}-b`,
    });
    const row = await db!.lead.findUniqueOrThrow({ where: { id } });
    expect(row.type).toBe("INSURANCE");
    expect(row.details).toEqual({ vehiculo: "Toyota Hilux", anio: 2020, patente: "BCDF12" });
  });

  it("limita envíos por visitante dentro de la ventana", async () => {
    const ipHash = `${IP}-c`;
    const l = lead("financiamiento", { nombre: "Zz Prueba", telefono: "912345678" });
    for (let i = 0; i < LEAD_RATE_LIMIT.max; i++) {
      expect(await isRateLimited(db!, ipHash)).toBe(false);
      await createLead(db!, l, { ipHash });
    }
    expect(await isRateLimited(db!, ipHash)).toBe(true);
    // Fuera de la ventana vuelve a permitir.
    expect(await isRateLimited(db!, ipHash, new Date(Date.now() + LEAD_RATE_LIMIT.windowMs + 1000))).toBe(false);
    // Sin IP no se limita (no se puede identificar al visitante).
    expect(await isRateLimited(db!, null)).toBe(false);
  });
});
