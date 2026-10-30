import { existsSync } from "node:fs";
import { afterAll, describe, expect, it } from "vitest";
import { createPrismaClient } from "@/lib/db/create-client";

if (existsSync(".env.local")) process.loadEnvFile(".env.local");
const url = process.env.DATABASE_URL;
const db = url ? createPrismaClient(url) : null;

afterAll(() => db?.$disconnect());

class Rollback extends Error {}

/** Ejecuta `fn` en una transacción y la revierte siempre. */
async function inRollback(fn: (tx: NonNullable<typeof db>) => Promise<void>) {
  await db!
    .$transaction(async (tx) => {
      await fn(tx as unknown as NonNullable<typeof db>);
      throw new Rollback();
    })
    .catch((e) => {
      if (!(e instanceof Rollback)) throw e;
    });
}

const base = { make: "Test", model: "Modelo" };

describe.skipIf(!db)("esquema e integridad", () => {
  it("slug único", async () => {
    await inRollback(async (tx) => {
      await tx.vehicle.create({ data: { ...base, slug: "test-unico" } });
      await expect(tx.vehicle.create({ data: { ...base, slug: "test-unico" } })).rejects.toThrow();
    });
  });

  it("instagramMediaId único (deduplicación)", async () => {
    await inRollback(async (tx) => {
      await tx.instagramPost.create({ data: { instagramMediaId: "999", mediaType: "IMAGE" } });
      await expect(tx.instagramPost.create({ data: { instagramMediaId: "999", mediaType: "IMAGE" } })).rejects.toThrow();
    });
  });

  it("upsert por instagramMediaId no duplica", async () => {
    await inRollback(async (tx) => {
      for (let i = 0; i < 3; i++) {
        await tx.instagramPost.upsert({
          where: { instagramMediaId: "888" },
          create: { instagramMediaId: "888", mediaType: "CAROUSEL_ALBUM" },
          update: { attempts: { increment: 1 } },
        });
      }
      const rows = await tx.instagramPost.findMany({ where: { instagramMediaId: "888" } });
      expect(rows).toHaveLength(1);
      expect(rows[0].attempts).toBe(2);
    });
  });

  it("misma imagen de Instagram no se repite en un vehículo", async () => {
    await inRollback(async (tx) => {
      const v = await tx.vehicle.create({ data: { ...base, slug: "test-imgs" } });
      await tx.vehicleImage.create({ data: { vehicleId: v.id, instagramMediaId: "c1", storageKey: "k/1.jpg", position: 0 } });
      await expect(
        tx.vehicleImage.create({ data: { vehicleId: v.id, instagramMediaId: "c1", storageKey: "k/2.jpg", position: 1 } }),
      ).rejects.toThrow();
    });
  });

  it.each([
    ["precio no positivo", { priceClp: 0 }],
    ["año fuera de rango", { year: 1850 }],
    ["kilometraje negativo", { mileageKm: -5 }],
    ["slug con mayúsculas", { slug: "Mal-Slug" }],
    ["features no es arreglo", { features: { a: 1 } }],
    ["publicado sin fecha", { published: true, publishedAt: null }],
  ])("CHECK rechaza %s", async (_name, patch) => {
    await inRollback(async (tx) => {
      await expect(tx.vehicle.create({ data: { ...base, slug: "test-check", ...patch } })).rejects.toThrow();
    });
  });

  it("SiteSettings solo admite la fila 1", async () => {
    await inRollback(async (tx) => {
      await expect(tx.siteSettings.create({ data: { id: 2, businessName: "X" } })).rejects.toThrow();
    });
  });

  it("el seed dejó demo idempotente y respeta la regla precio+año", async () => {
    const demos = await db!.vehicle.findMany({ where: { isDemo: true } });
    const slugs = new Set(demos.map((d) => d.slug));
    expect(slugs.size).toBe(demos.length);
    for (const v of demos) {
      expect(v.slug.startsWith("demo-")).toBe(true);
      if (v.published) {
        expect(v.priceClp).not.toBeNull();
        expect(v.year).not.toBeNull();
      }
    }
    expect(demos.find((d) => d.priceClp === null)?.published).toBe(false);
  });
});
