import { existsSync } from "node:fs";
import { afterAll, describe, expect, it } from "vitest";
import type { Prisma } from "@/generated/prisma/client";
import { createPrismaClient } from "@/lib/db/create-client";
import { parseCatalogFilters } from "@/lib/vehicles/filters";
import { findVehicleBySlug, getFacets, listIndexableSlugs, listRelated, listVehicles } from "@/server/vehicles/repository";

// Datos de prueba propios dentro de una transacción que SIEMPRE se revierte:
// no dependen del inventario real ni lo modifican.
if (existsSync(".env.local")) process.loadEnvFile(".env.local");
const url = process.env.DATABASE_URL;
const db = url ? createPrismaClient(url) : null;
afterAll(() => db?.$disconnect());

type Tx = Prisma.TransactionClient;
class Rollback extends Error {}

const MAKE = "Zzprueba"; // marca ficticia: aísla los resultados de los vehículos reales
const at = (d: string) => new Date(`${d}T12:00:00Z`);

const FIXTURES: Prisma.VehicleCreateManyInput[] = [
  { slug: "zz-a-2021", make: MAKE, model: "Alfa", year: 2021, mileageKm: 48500, priceClp: 18990000, fuelType: "GASOLINE", transmission: "AUTOMATIC", published: true, publishedAt: at("2026-10-05") },
  { slug: "zz-b-2020", make: MAKE, model: "Beta", version: "4x4", year: 2020, mileageKm: 87200, priceClp: 24490000, fuelType: "DIESEL", transmission: "MANUAL", drivetrain: "FOUR_WD", published: true, publishedAt: at("2026-10-04") },
  { slug: "zz-c-2019", make: MAKE, model: "Gamma", year: 2019, mileageKm: 61000, priceClp: 21900000, fuelType: "GASOLINE", transmission: "AUTOMATIC", status: "RESERVED", published: true, publishedAt: at("2026-10-03") },
  { slug: "zz-d-2021", make: MAKE, model: "Delta", year: 2021, mileageKm: null, priceClp: 26500000, fuelType: "DIESEL", transmission: "AUTOMATIC", published: true, publishedAt: at("2026-10-02"), features: ["Cámara"] },
  { slug: "zz-sold-2018", make: MAKE, model: "Vendido", year: 2018, priceClp: 13490000, status: "SOLD", published: true, publishedAt: at("2026-10-01") },
  { slug: "zz-draft-2023", make: MAKE, model: "Borrador", year: 2023, priceClp: null, published: false },
  { slug: "zz-withdrawn-2022", make: MAKE, model: "Retirado", year: 2022, priceClp: 9990000, status: "WITHDRAWN", published: true, publishedAt: at("2026-09-30") },
];

async function withFixtures(fn: (tx: Tx) => Promise<void>) {
  await db!
    .$transaction(async (tx) => {
      await tx.vehicle.createMany({ data: FIXTURES });
      await fn(tx);
      throw new Rollback();
    }, { timeout: 30_000 })
    .catch((e) => {
      if (!(e instanceof Rollback)) throw e;
    });
}

const mine = (q: Record<string, string> = {}) => parseCatalogFilters({ marca: MAKE, ...q });

describe.skipIf(!db)("catálogo público (datos de prueba revertidos)", () => {
  it("excluye vendidos, retirados y no publicados", async () => {
    await withFixtures(async (tx) => {
      const { vehicles, total } = await listVehicles(tx, mine());
      expect(total).toBe(4);
      expect(vehicles.map((v) => v.slug)).toEqual(["zz-a-2021", "zz-b-2020", "zz-c-2019", "zz-d-2021"]);
      expect(vehicles.every((v) => v.status === "AVAILABLE" || v.status === "RESERVED")).toBe(true);
    });
  });

  it("filtros combinados", async () => {
    await withFixtures(async (tx) => {
      const { vehicles } = await listVehicles(tx, mine({ combustible: "diesel", transmision: "automatica" }));
      expect(vehicles.map((v) => v.slug)).toEqual(["zz-d-2021"]);
    });
  });

  it("búsqueda por texto en modelo/versión", async () => {
    await withFixtures(async (tx) => {
      expect((await listVehicles(tx, mine({ q: "gamma" }))).vehicles.map((v) => v.slug)).toEqual(["zz-c-2019"]);
      expect((await listVehicles(tx, mine({ q: "beta 4x4" }))).vehicles.map((v) => v.slug)).toEqual(["zz-b-2020"]);
    });
  });

  it("rango de precio y año", async () => {
    await withFixtures(async (tx) => {
      const { vehicles } = await listVehicles(tx, mine({ precioMax: "22000000", anioMin: "2019" }));
      expect(vehicles.map((v) => v.slug).sort()).toEqual(["zz-a-2021", "zz-c-2019"]);
    });
  });

  it("orden por precio y kilometraje (sin dato al final)", async () => {
    await withFixtures(async (tx) => {
      const prices = (await listVehicles(tx, mine({ orden: "precio-asc" }))).vehicles.map((v) => v.priceClp!);
      expect(prices).toEqual([...prices].sort((a, b) => a - b));
      expect((await listVehicles(tx, mine({ orden: "km-asc" }))).vehicles.at(-1)?.slug).toBe("zz-d-2021");
    });
  });

  it("página fuera de rango se ajusta a la última", async () => {
    await withFixtures(async (tx) => {
      const r = await listVehicles(tx, mine({ pagina: "99" }));
      expect(r.page).toBe(r.pageCount);
      expect(r.vehicles.length).toBeGreaterThan(0);
    });
  });

  it("facetas solo con valores de vehículos visibles", async () => {
    await withFixtures(async (tx) => {
      const f = await getFacets(tx);
      const visible = await tx.vehicle.findMany({ where: { published: true, status: { in: ["AVAILABLE", "RESERVED"] } } });
      expect(f.makes.map((m) => m.value).sort()).toEqual([...new Set(visible.map((v) => v.make))].sort());
      expect(f.makes.find((m) => m.value === MAKE)?.count).toBe(4);
    });
  });

  it("ficha: vendido visible; borrador, retirado e inexistente ocultos", async () => {
    await withFixtures(async (tx) => {
      expect((await findVehicleBySlug(tx, "zz-sold-2018"))?.status).toBe("SOLD");
      expect(await findVehicleBySlug(tx, "zz-draft-2023")).toBeNull();
      expect(await findVehicleBySlug(tx, "zz-withdrawn-2022")).toBeNull();
      expect(await findVehicleBySlug(tx, "no-existe")).toBeNull();
      expect((await findVehicleBySlug(tx, "zz-d-2021"))?.features).toEqual(["Cámara"]);
    });
  });

  it("relacionados excluyen el propio y los no visibles", async () => {
    await withFixtures(async (tx) => {
      const v = (await findVehicleBySlug(tx, "zz-b-2020"))!;
      const related = await listRelated(tx, v, 3);
      expect(related.map((r) => r.id)).not.toContain(v.id);
      expect(related.every((r) => r.status === "AVAILABLE" || r.status === "RESERVED")).toBe(true);
    });
  });

  it("slugs indexables no incluyen vendidos, retirados ni borradores", async () => {
    await withFixtures(async (tx) => {
      const slugs = (await listIndexableSlugs(tx)).map((s) => s.slug).filter((s) => s.startsWith("zz-"));
      expect(slugs.sort()).toEqual(["zz-a-2021", "zz-b-2020", "zz-c-2019", "zz-d-2021"]);
    });
  });

  it("los datos de prueba no quedan en la base", async () => {
    expect(await db!.vehicle.count({ where: { make: MAKE } })).toBe(0);
  });
});
