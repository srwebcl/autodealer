import { existsSync } from "node:fs";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { createPrismaClient } from "@/lib/db/create-client";
import { InstagramApiError } from "@/lib/instagram/client";
import type { IgChildMedia, IgMedia } from "@/lib/instagram/types";
import type { ObjectStorage } from "@/lib/storage/r2";
import { acquireLock, DEFAULT_SYNC_OPTIONS, releaseLock, runSync, type SyncDeps } from "@/server/instagram/sync";

if (existsSync(".env.local")) process.loadEnvFile(".env.local");
const url = process.env.DATABASE_URL;
const db = url ? createPrismaClient(url) : null;

// IDs ficticios con prefijo propio para limpiar sin tocar datos reales.
const P = "99000000";
const runIds: string[] = [];

async function cleanup() {
  if (!db) return;
  const posts = await db.instagramPost.findMany({ where: { instagramMediaId: { startsWith: P } }, select: { id: true } });
  await db.vehicle.deleteMany({ where: { instagramPostId: { in: posts.map((p) => p.id) } } });
  await db.syncLog.deleteMany({ where: { OR: [{ postId: { in: posts.map((p) => p.id) } }, { runId: { in: runIds } }] } });
  await db.instagramPost.deleteMany({ where: { instagramMediaId: { startsWith: P } } });
  await db.syncRun.deleteMany({ where: { id: { in: runIds } } });
  await db.syncLock.updateMany({ where: { id: 1 }, data: { holder: null, lockedUntil: null } });
}
afterAll(async () => {
  await cleanup();
  await db?.$disconnect();
});

const JPEG = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 9, 9, 9, 9]);
const CDN = (id: string) => `https://scontent.cdninstagram.com/${id}.jpg?firma=temporal`;

const CAPTION = `TOYOTA HILUX 2.4 SRV 4X4 2020
Kilometraje: 87.200 km
Transmisión: Manual
Precio: $24.490.000`;

function carousel(id: string, caption: string, childIds: string[], ts = "2026-10-20T12:00:00+0000"): IgMedia {
  return {
    id,
    caption,
    media_type: "CAROUSEL_ALBUM",
    permalink: `https://www.instagram.com/p/${id}/`,
    timestamp: ts,
    children: { data: childIds.map((c) => ({ id: c, media_type: c.endsWith("v") ? "VIDEO" : "IMAGE", media_url: CDN(c) })) as IgChildMedia[] },
  } as IgMedia;
}
const image = (id: string, caption: string, ts = "2026-10-19T12:00:00+0000"): IgMedia =>
  ({ id, caption, media_type: "IMAGE", media_url: CDN(id), permalink: `https://www.instagram.com/p/${id}/`, timestamp: ts }) as IgMedia;

class FakeStorage implements ObjectStorage {
  objects = new Map<string, number>();
  puts = 0;
  deletes = 0;
  async exists(k: string) {
    return this.objects.has(k);
  }
  async put(k: string, b: Uint8Array) {
    this.puts++;
    this.objects.set(k, b.byteLength);
  }
  async delete(k: string) {
    this.deletes++;
    this.objects.delete(k);
  }
  publicUrl(k: string) {
    return `https://media.test/${k}`;
  }
}

let feed: IgMedia[] = [];
let storage: FakeStorage;
let failDownloadFor: string | null = null;
let apiError: InstagramApiError | null = null;

const deps = (): SyncDeps => ({
  db: db!,
  storage,
  client: {
    async *listMedia() {
      if (apiError) throw apiError;
      yield feed;
    },
    async getAllChildren(m: IgMedia) {
      return m.children?.data ?? [];
    },
  },
  download: async (u: string) => {
    if (failDownloadFor && u.includes(failDownloadFor)) throw new Error("timeout simulado");
    return { bytes: JPEG, contentType: "image/jpeg" as const, ext: "jpg" };
  },
});

const opts = { ...DEFAULT_SYNC_OPTIONS, since: new Date("2026-10-01T00:00:00Z"), autoPublishSince: new Date("2026-10-01T00:00:00Z") };
async function sync() {
  const r = await runSync(deps(), "SCRIPT", opts);
  if (r.status !== "locked") runIds.push(r.runId);
  return r;
}
const vehicleFor = (mediaId: string) =>
  db!.vehicle.findFirst({ where: { instagramPost: { instagramMediaId: mediaId } }, include: { images: { orderBy: { position: "asc" } } } });

describe.skipIf(!db)("sincronización Instagram (fakes + base real)", () => {
  beforeEach(async () => {
    await cleanup();
    storage = new FakeStorage();
    failDownloadFor = null;
    apiError = null;
    feed = [
      carousel(`${P}1`, CAPTION, [`${P}11`, `${P}12v`, `${P}13`, `${P}14`]),
      image(`${P}2`, "KIA MORNING 1.2 EX\nConsulta precio por interno"),
      { id: `${P}3`, media_type: "VIDEO", caption: "Reel", timestamp: "2026-10-18T12:00:00+0000" } as IgMedia,
      image(`${P}4`, "¡Feliz fin de semana! Atendemos sábado hasta las 14:00"),
      image(`${P}5`, "MAZDA 3 2015 $8.990.000", "2026-09-01T12:00:00+0000"), // antes de `since`
    ];
  });

  it("primera ejecución: crea, publica, omite y deja pendientes según las reglas", async () => {
    const r = await sync();
    expect(r).toMatchObject({ status: "SUCCESS" });
    if (r.status === "locked") return;
    expect(r.stats).toMatchObject({ seen: 4, created: 2, published: 1, pendingReview: 1, skipped: 2, imagesUploaded: 4 });

    const hilux = await vehicleFor(`${P}1`);
    expect(hilux).toMatchObject({ make: "Toyota", model: "Hilux", year: 2020, priceClp: 24490000, mileageKm: 87200, published: true, status: "AVAILABLE", source: "INSTAGRAM" });
    // Solo imágenes (el video del carrusel se omite) y en el orden del carrusel.
    expect(hilux!.images.map((i) => i.instagramMediaId)).toEqual([`${P}11`, `${P}13`, `${P}14`]);
    expect(hilux!.images[0].publicUrl).toBe(`https://media.test/instagram/${P}1/${P}11.jpg`);
    expect(hilux!.images.every((i) => !i.publicUrl?.includes("firma"))).toBe(true);

    const kia = await vehicleFor(`${P}2`);
    expect(kia).toMatchObject({ make: "Kia", published: false, priceClp: null, year: null });
    const kiaPost = await db!.instagramPost.findUnique({ where: { instagramMediaId: `${P}2` } });
    expect(kiaPost?.syncStatus).toBe("PENDING");
    expect(kiaPost?.lastError).toMatch(/año, precio/);

    expect((await db!.instagramPost.findUnique({ where: { instagramMediaId: `${P}3` } }))?.syncStatus).toBe("SKIPPED");
    expect((await db!.instagramPost.findUnique({ where: { instagramMediaId: `${P}4` } }))?.syncStatus).toBe("SKIPPED");
    expect(await db!.instagramPost.findUnique({ where: { instagramMediaId: `${P}5` } })).toBeNull();
  });

  it("reintentar no duplica nada", async () => {
    await sync();
    const r2 = await sync();
    if (r2.status === "locked") throw new Error("locked");
    expect(r2.stats).toMatchObject({ processed: 0, unchanged: 4, imagesUploaded: 0 });
    expect(await db!.vehicle.count({ where: { instagramPost: { instagramMediaId: { startsWith: P } } } })).toBe(2);
    expect(await db!.vehicleImage.count({ where: { storageKey: { startsWith: `instagram/${P}` } } })).toBe(4);
    expect(storage.puts).toBe(4);
  });

  it("caption editado: actualiza el mismo vehículo, reutiliza imágenes y respeta disponibilidad", async () => {
    await sync();
    const before = await vehicleFor(`${P}1`);
    await db!.vehicle.update({ where: { id: before!.id }, data: { status: "SOLD" } });
    feed[0] = carousel(`${P}1`, CAPTION.replace("24.490.000", "23.990.000"), [`${P}11`, `${P}12v`, `${P}13`, `${P}14`]);
    const r = await sync();
    if (r.status === "locked") throw new Error("locked");
    expect(r.stats).toMatchObject({ updated: 1, created: 0, imagesUploaded: 0, imagesReused: 3 });
    const after = await vehicleFor(`${P}1`);
    expect(after).toMatchObject({ id: before!.id, slug: before!.slug, priceClp: 23990000, status: "SOLD" });
  });

  it("no sobrescribe campos editados en el panel (lockedFields)", async () => {
    await sync();
    const v = await vehicleFor(`${P}1`);
    await db!.vehicle.update({ where: { id: v!.id }, data: { priceClp: 25000000, lockedFields: ["priceClp"] } });
    feed[0] = carousel(`${P}1`, CAPTION.replace("24.490.000", "19.990.000"), [`${P}11`, `${P}13`, `${P}14`]);
    await sync();
    expect((await vehicleFor(`${P}1`))?.priceClp).toBe(25000000);
  });

  it("imagen eliminada del carrusel se quita del vehículo y de R2", async () => {
    await sync();
    feed[0] = carousel(`${P}1`, CAPTION, [`${P}11`, `${P}14`]);
    const r = await sync();
    if (r.status === "locked") throw new Error("locked");
    expect(r.stats.imagesRemoved).toBe(1);
    expect((await vehicleFor(`${P}1`))!.images.map((i) => [i.instagramMediaId, i.position])).toEqual([
      [`${P}11`, 0],
      [`${P}14`, 1],
    ]);
    expect(storage.objects.has(`instagram/${P}1/${P}13.jpg`)).toBe(false);
  });

  it("fallo de descarga: publicación en ERROR, ejecución PARTIAL y reintento posterior exitoso", async () => {
    failDownloadFor = `${P}13`;
    const r1 = await sync();
    expect(r1).toMatchObject({ status: "PARTIAL" });
    const post = await db!.instagramPost.findUnique({ where: { instagramMediaId: `${P}1` } });
    expect(post).toMatchObject({ syncStatus: "ERROR", attempts: 1 });
    expect(post?.lastError).toMatch(/timeout simulado/);
    expect(await vehicleFor(`${P}1`)).toBeNull(); // nada a medias

    failDownloadFor = null;
    const r2 = await sync();
    expect(r2).toMatchObject({ status: "SUCCESS" });
    expect((await db!.instagramPost.findUnique({ where: { instagramMediaId: `${P}1` } }))).toMatchObject({ syncStatus: "SUCCESS", attempts: 2 });
    expect((await vehicleFor(`${P}1`))?.images).toHaveLength(3);
  });

  it("token inválido: FAILED, sin cambios y candado liberado", async () => {
    apiError = new InstagramApiError("OAuthException 190", "auth", 190, 400);
    const r = await sync();
    expect(r).toMatchObject({ status: "FAILED" });
    expect((await db!.syncLock.findUnique({ where: { id: 1 } }))?.holder).toBeNull();
  });

  it("candado: no corre si otra sincronización está activa", async () => {
    expect(await acquireLock(db!, "otro-proceso", 60_000, new Date())).toBe(true);
    expect(await sync()).toEqual({ status: "locked" });
    await releaseLock(db!, "otro-proceso");
    expect((await sync()).status).toBe("SUCCESS");
  });

  it("candado vencido (proceso muerto) se recupera", async () => {
    await acquireLock(db!, "proceso-muerto", 60_000, new Date(Date.now() - 3_600_000));
    expect((await sync()).status).toBe("SUCCESS");
  });

  it("respeta el máximo por ejecución y deja el resto para la siguiente", async () => {
    const r = await runSync(deps(), "SCRIPT", { ...opts, maxPostsPerRun: 1 });
    if (r.status === "locked") throw new Error("locked");
    runIds.push(r.runId);
    expect(r.stats).toMatchObject({ processed: 1, deferred: 3 });
  });

  it("publicaciones históricas (antes de autoPublishSince) quedan como borrador", async () => {
    const r = await runSync(deps(), "SCRIPT", { ...opts, autoPublishSince: new Date("2026-10-25T00:00:00Z") });
    if (r.status === "locked") throw new Error("locked");
    runIds.push(r.runId);
    expect(r.stats.published).toBe(0);
    const hilux = await vehicleFor(`${P}1`);
    expect(hilux).toMatchObject({ published: false, publishedAt: null });
    const post = await db!.instagramPost.findUnique({ where: { instagramMediaId: `${P}1` } });
    expect(post?.syncStatus).toBe("PENDING");
    expect(post?.lastError).toMatch(/Disponibilidad no confirmada/);
  });

  it("sin autoPublishSince no se publica nada automáticamente", async () => {
    const r = await runSync(deps(), "SCRIPT", { ...opts, autoPublishSince: null });
    if (r.status === "locked") throw new Error("locked");
    runIds.push(r.runId);
    expect(r.stats.published).toBe(0);
    expect(await db!.vehicle.count({ where: { published: true, instagramPost: { instagramMediaId: { startsWith: P } } } })).toBe(0);
  });

  it("prueba controlada: solo procesa los IDs indicados", async () => {
    const r = await runSync(deps(), "SCRIPT", { ...opts, onlyMediaIds: [`${P}1`] });
    if (r.status === "locked") throw new Error("locked");
    runIds.push(r.runId);
    expect(r.stats).toMatchObject({ seen: 1, processed: 1, created: 1 });
    expect(await db!.instagramPost.count({ where: { instagramMediaId: { startsWith: P } } })).toBe(1);
  });

  it("registra la ejecución y sus eventos sin URLs firmadas", async () => {
    const r = await sync();
    if (r.status === "locked") throw new Error("locked");
    const run = await db!.syncRun.findUnique({ where: { id: r.runId }, include: { logs: true } });
    expect(run?.status).toBe("SUCCESS");
    expect(run?.finishedAt).not.toBeNull();
    expect(run?.logs.some((l) => l.eventType === "vehicle.published")).toBe(true);
    expect(JSON.stringify(run?.logs)).not.toContain("firma=temporal");
  });
});
