import { existsSync } from "node:fs";
import { afterAll, describe, expect, it } from "vitest";
import { createPrismaClient } from "@/lib/db/create-client";
import { parseCatalogFilters } from "@/lib/vehicles/filters";
import { findVehicleBySlug, getFacets, listIndexableSlugs, listRelated, listVehicles } from "@/server/vehicles/repository";

// Solo lectura sobre los datos del seed demo (npm run db:seed).
if (existsSync(".env.local")) process.loadEnvFile(".env.local");
const url = process.env.DATABASE_URL;
const db = url ? createPrismaClient(url) : null;
afterAll(() => db?.$disconnect());

const list = (q: Record<string, string> = {}) => listVehicles(db!, parseCatalogFilters(q), true);

describe.skipIf(!db)("catálogo público (datos demo)", () => {
  // Las aserciones se limitan a los datos demo: la base puede tener además vehículos reales.
  it("excluye vendidos y no publicados", async () => {
    const { vehicles } = await list();
    const slugs = vehicles.map((v) => v.slug);
    expect(slugs.filter((s) => s.startsWith("demo-"))).toHaveLength(5);
    expect(slugs).not.toContain("demo-kia-sportage-2018"); // SOLD
    expect(slugs).not.toContain("demo-suzuki-swift-2023"); // sin precio → no publicado
    expect(vehicles.every((v) => v.status === "AVAILABLE" || v.status === "RESERVED")).toBe(true);
  });

  it("sin demo no muestra ningún vehículo demo (producción)", async () => {
    const { vehicles, total } = await listVehicles(db!, parseCatalogFilters({}), false);
    expect(vehicles.some((v) => v.isDemo)).toBe(false);
    const realVisible = await db!.vehicle.count({ where: { isDemo: false, published: true, status: { in: ["AVAILABLE", "RESERVED"] } } });
    expect(total).toBe(realVisible);
  });

  it("filtros combinados", async () => {
    const { vehicles } = await list({ combustible: "diesel", transmision: "automatica" });
    expect(vehicles.map((v) => v.slug)).toEqual(["demo-chevrolet-colorado-2021"]);
  });

  it("búsqueda por texto en marca/modelo/versión", async () => {
    expect((await list({ q: "cx-5" })).vehicles.map((v) => v.make)).toEqual(["Mazda"]);
    expect((await list({ q: "toyota 4x4" })).vehicles.map((v) => v.model)).toEqual(["Hilux"]);
  });

  it("rango de precio y año", async () => {
    const { vehicles } = await list({ precioMax: "22000000", anioMin: "2019" });
    expect(vehicles.map((v) => v.slug).sort()).toEqual(["demo-mazda-cx-5-2021", "demo-volkswagen-golf-2019"]);
  });

  it("ordena por precio ascendente", async () => {
    const prices = (await list({ orden: "precio-asc" })).vehicles.map((v) => v.priceClp!);
    expect(prices).toEqual([...prices].sort((a, b) => a - b));
  });

  it("km ascendente deja los sin kilometraje al final", async () => {
    const { vehicles } = await list({ orden: "km-asc" });
    expect(vehicles.at(-1)?.mileageKm).toBeNull();
  });

  it("página fuera de rango se ajusta a la última", async () => {
    const r = await list({ pagina: "99" });
    expect(r.page).toBe(r.pageCount);
    expect(r.vehicles.length).toBeGreaterThan(0);
  });

  it("facetas solo con valores existentes", async () => {
    const f = await getFacets(db!, true);
    const visible = await db!.vehicle.findMany({ where: { published: true, status: { in: ["AVAILABLE", "RESERVED"] } } });
    const makes = f.makes.map((m) => m.value);
    expect(makes.sort()).toEqual([...new Set(visible.map((v) => v.make))].sort());
    expect(makes).not.toContain("Kia"); // solo existe vendido
    expect(makes).not.toContain("Suzuki"); // solo existe no publicado
    expect(f.yearMin).toBe(Math.min(...visible.map((v) => v.year!).filter(Boolean)));
  });

  it("ficha: vendido visible, no publicado y retirado ocultos", async () => {
    expect((await findVehicleBySlug(db!, "demo-kia-sportage-2018", true))?.status).toBe("SOLD");
    expect(await findVehicleBySlug(db!, "demo-suzuki-swift-2023", true)).toBeNull();
    expect(await findVehicleBySlug(db!, "no-existe", true)).toBeNull();
    const v = await findVehicleBySlug(db!, "demo-mazda-cx-5-2021", true);
    expect(v?.features).toContain("Apple CarPlay");
    expect(v?.drivetrain).toBe("AWD");
  });

  it("relacionados excluyen el propio y los no visibles", async () => {
    const v = (await findVehicleBySlug(db!, "demo-toyota-hilux-2020", true))!;
    const related = await listRelated(db!, v, 3, true);
    expect(related.map((r) => r.id)).not.toContain(v.id);
    expect(related.every((r) => r.status !== "SOLD")).toBe(true);
  });

  it("slugs indexables no incluyen vendidos", async () => {
    const slugs = (await listIndexableSlugs(db!, true)).map((s) => s.slug);
    expect(slugs.filter((s) => s.startsWith("demo-"))).toHaveLength(5);
    expect(slugs).not.toContain("demo-kia-sportage-2018");
  });
});
