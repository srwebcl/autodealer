import { createHash, randomUUID } from "node:crypto";
import { Prisma, type PrismaClient } from "@/generated/prisma/client";
import type { InstagramPost, SyncTrigger } from "@/generated/prisma/client";
import { InstagramApiError, type InstagramClient } from "@/lib/instagram/client";
import { describeUrl, downloadImage } from "@/lib/instagram/download";
import { featureList, parseCommercialContent, plainDescription } from "@/lib/instagram/commercial-content";
import { looksLikeVehicle, parseCaption, publishBlockers, type ParsedVehicle } from "@/lib/instagram/parse-caption";
import type { IgChildMedia, IgMedia } from "@/lib/instagram/types";
import { instagramImageKey, type ObjectStorage } from "@/lib/storage/r2";
import { vehicleSlug } from "@/lib/utils/slug";

/**
 * Sincronización Instagram → Neon + R2.
 * Idempotente: la misma publicación siempre produce el mismo InstagramPost, el mismo
 * Vehicle (1:1) y las mismas claves de R2. Reintentar no duplica nada.
 */

export interface SyncOptions {
  /** Ignora publicaciones anteriores a esta fecha (evita importar vehículos antiguos ya vendidos). */
  since: Date;
  /** Máximo de publicaciones a procesar por ejecución (el resto queda para la siguiente). */
  maxPostsPerRun: number;
  maxImagesPerPost: number;
  /** Tope de almacenamiento propio en R2, por debajo del plan gratuito (10 GB). */
  maxStorageBytes: number;
  /** Reintentos máximos para publicaciones en ERROR con contenido sin cambios. */
  maxAttempts: number;
  lockTtlMs: number;
  /**
   * Solo se publican automáticamente publicaciones de Instagram desde esta fecha.
   * Las anteriores (históricas, disponibilidad no confirmada) quedan como borrador.
   * null = nunca publicar automáticamente.
   */
  autoPublishSince: Date | null;
  /** Prueba controlada: procesar solo estos IDs de publicación. */
  onlyMediaIds?: string[];
  /**
   * Retiro automático: si la publicación de un vehículo visible desaparece de Instagram
   * (borrada o archivada) en `afterMisses` sincronizaciones completas seguidas, el vehículo
   * pasa a WITHDRAWN. Si en una ejecución faltan más de `maxPerRun`, se asume una anomalía
   * de la API y no se retira nada. null = desactivado.
   */
  withdrawMissing: { afterMisses: number; maxPerRun: number } | null;
}

export const DEFAULT_SYNC_OPTIONS: Omit<SyncOptions, "since" | "autoPublishSince"> = {
  maxPostsPerRun: 15,
  maxImagesPerPost: 20,
  maxStorageBytes: 8 * 1024 ** 3,
  maxAttempts: 5,
  lockTtlMs: 10 * 60_000,
  withdrawMissing: null,
};

export interface SyncDeps {
  db: PrismaClient;
  client: Pick<InstagramClient, "listMedia" | "getAllChildren">;
  storage: ObjectStorage;
  download?: typeof downloadImage;
  now?: () => Date;
}

export interface SyncStats {
  seen: number;
  unchanged: number;
  processed: number;
  created: number;
  updated: number;
  published: number;
  pendingReview: number;
  skipped: number;
  errors: number;
  imagesUploaded: number;
  imagesReused: number;
  imagesRemoved: number;
  deferred: number;
  missing: number;
  withdrawn: number;
  restored: number;
}

export type SyncResult =
  | { status: "locked" }
  | { status: "SUCCESS" | "PARTIAL" | "FAILED"; runId: string; stats: SyncStats; error?: string; changed: boolean };

const emptyStats = (): SyncStats => ({
  seen: 0,
  unchanged: 0,
  processed: 0,
  created: 0,
  updated: 0,
  published: 0,
  pendingReview: 0,
  skipped: 0,
  errors: 0,
  imagesUploaded: 0,
  imagesReused: 0,
  imagesRemoved: 0,
  deferred: 0,
  missing: 0,
  withdrawn: 0,
  restored: 0,
});

// ─── Candado ──────────────────────────────────────────────────────────

export async function acquireLock(db: PrismaClient, holder: string, ttlMs: number, now: Date): Promise<boolean> {
  await db.syncLock.upsert({ where: { id: 1 }, create: { id: 1 }, update: {} });
  // UPDATE condicional atómico: solo uno gana aunque Vercel invoque dos veces.
  const { count } = await db.syncLock.updateMany({
    where: { id: 1, OR: [{ lockedUntil: null }, { lockedUntil: { lt: now } }] },
    data: { holder, lockedUntil: new Date(now.getTime() + ttlMs) },
  });
  return count === 1;
}

export async function releaseLock(db: PrismaClient, holder: string) {
  await db.syncLock.updateMany({ where: { id: 1, holder }, data: { holder: null, lockedUntil: null } });
}

// ─── Utilidades ───────────────────────────────────────────────────────

/** Huella del contenido relevante: caption + medios. Si no cambia, no se reprocesa. */
export function contentHash(media: IgMedia, childIds: string[]): string {
  return createHash("sha256")
    .update(JSON.stringify([media.caption ?? "", media.media_type, childIds]))
    .digest("hex");
}

/** Campos del vehículo que puede escribir la sincronización (el resto lo gestiona el panel). */
const SYNCED_FIELDS = [
  "make",
  "model",
  "version",
  "year",
  "mileageKm",
  "priceClp",
  "engine",
  "fuelType",
  "transmission",
  "drivetrain",
  "color",
  "description",
  "features",
  "content",
] as const;

/** Datos del vehículo derivados del caption (campos técnicos + contenido comercial estructurado). */
export function vehicleDataFromCaption(caption: string | null | undefined, v: ParsedVehicle, locked: string[]): Partial<Prisma.VehicleUncheckedCreateInput> {
  const content = parseCommercialContent(caption);
  const derived: Record<(typeof SYNCED_FIELDS)[number], unknown> = {
    make: v.make,
    model: v.model,
    version: v.version,
    year: v.year,
    mileageKm: v.mileageKm,
    priceClp: v.priceClp,
    engine: v.engine,
    fuelType: v.fuelType,
    transmission: v.transmission,
    drivetrain: v.drivetrain,
    color: v.color,
    description: (content && plainDescription(content)) ?? v.description,
    features: content && featureList(content).length ? featureList(content) : v.features,
    content: content ?? undefined,
  };
  const data: Record<string, unknown> = {};
  for (const field of SYNCED_FIELDS) {
    if (locked.includes(field)) continue;
    // null explícito si el caption ya no trae el dato: no se conserva un valor viejo no respaldado.
    const value = derived[field];
    data[field] = value === undefined ? (field === "content" ? Prisma.DbNull : null) : value;
  }
  return data as Partial<Prisma.VehicleUncheckedCreateInput>;
}

function errorMessage(err: unknown): string {
  return (err instanceof Error ? err.message : String(err)).slice(0, 500);
}

// ─── Sincronización ───────────────────────────────────────────────────

export async function runSync(deps: SyncDeps, trigger: SyncTrigger, opts: SyncOptions): Promise<SyncResult> {
  const { db, client, storage } = deps;
  const download = deps.download ?? downloadImage;
  const now = deps.now ?? (() => new Date());
  const holder = randomUUID();

  if (!(await acquireLock(db, holder, opts.lockTtlMs, now()))) return { status: "locked" };

  const stats = emptyStats();
  let changed = false;
  const run = await db.syncRun.create({ data: { trigger } });

  const log = (
    level: "INFO" | "WARN" | "ERROR",
    eventType: string,
    message: string,
    postId?: string | null,
    details?: Prisma.InputJsonValue,
  ) => db.syncLog.create({ data: { runId: run.id, postId: postId ?? null, level, eventType, message, details } });

  let fatal: string | undefined;
  // IDs vistos en el feed dentro de la ventana `since` (para detectar publicaciones borradas).
  const seenIds = new Set<string>();
  try {
    await log("INFO", "sync.started", `Sincronización ${trigger.toLowerCase()} iniciada`, null, {
      since: opts.since.toISOString(),
      maxPostsPerRun: opts.maxPostsPerRun,
    });

    let usedBytes = (await db.vehicleImage.aggregate({ _sum: { bytes: true } }))._sum.bytes ?? 0;

    scan: for await (const page of client.listMedia()) {
      for (const media of page) {
        const published = new Date(media.timestamp);
        if (published < opts.since) break scan; // la API devuelve de más reciente a más antigua
        seenIds.add(media.id);
        if (opts.onlyMediaIds && !opts.onlyMediaIds.includes(media.id)) continue;
        stats.seen++;

        const existing = await db.instagramPost.findUnique({ where: { instagramMediaId: media.id } });
        // Los IDs de hijos vienen en la respuesta; si faltan, getAllChildren los completa en el proceso.
        const quickChildIds = media.children?.data.map((c) => c.id) ?? [];
        const quickHash = contentHash(media, quickChildIds);
        const unchanged = existing && existing.contentHash === quickHash;
        const retryable = existing?.syncStatus === "ERROR" && existing.attempts < opts.maxAttempts;
        if (unchanged && !retryable && existing.syncStatus !== "PROCESSING") {
          stats.unchanged++;
          continue;
        }
        if (stats.processed >= opts.maxPostsPerRun) {
          stats.deferred++;
          continue;
        }
        stats.processed++;

        try {
          const outcome = await processPost({ db, client, storage, download, log, opts, media, existing, usedBytes });
          usedBytes += outcome.bytesAdded;
          stats.imagesUploaded += outcome.uploaded;
          stats.imagesReused += outcome.reused;
          stats.imagesRemoved += outcome.removed;
          if (outcome.result === "skipped") stats.skipped++;
          if (outcome.result === "pending") stats.pendingReview++;
          if (outcome.result === "published") stats.published++;
          if (outcome.vehicle === "created") stats.created++;
          if (outcome.vehicle === "updated") stats.updated++;
          if (outcome.vehicle) changed = true;
        } catch (err) {
          stats.errors++;
          const message = errorMessage(err);
          await db.instagramPost
            .update({ where: { instagramMediaId: media.id }, data: { syncStatus: "ERROR", lastError: message } })
            .catch(() => undefined);
          const post = await db.instagramPost.findUnique({ where: { instagramMediaId: media.id }, select: { id: true } });
          await log("ERROR", "post.failed", message, post?.id, { instagramMediaId: media.id });
          // Token inválido o límite de uso: no tiene sentido seguir en esta ejecución.
          if (err instanceof InstagramApiError && (err.kind === "auth" || err.kind === "rate_limit")) throw err;
        }
      }
    }

    // Solo con un recorrido completo del feed (sin error fatal ni filtro de prueba).
    if (opts.withdrawMissing && !opts.onlyMediaIds) {
      const r = await reconcileMissing(db, seenIds, opts.since, opts.withdrawMissing, log);
      stats.missing = r.missing;
      stats.withdrawn = r.withdrawn;
      stats.restored = r.restored;
      if (r.withdrawn || r.restored) changed = true;
    }
  } catch (err) {
    fatal = errorMessage(err);
    await log("ERROR", "sync.failed", fatal);
  } finally {
    const status = fatal ? "FAILED" : stats.errors > 0 ? "PARTIAL" : "SUCCESS";
    await db.syncRun.update({
      where: { id: run.id },
      data: { status, finishedAt: now(), stats: stats as unknown as Prisma.InputJsonValue, error: fatal ?? null },
    });
    await log(fatal ? "ERROR" : "INFO", "sync.finished", `Sincronización terminada: ${status}`, null, stats as unknown as Prisma.InputJsonValue);
    await releaseLock(db, holder);
  }

  const status = fatal ? "FAILED" : stats.errors > 0 ? "PARTIAL" : "SUCCESS";
  return { status, runId: run.id, stats, error: fatal, changed };
}

// ─── Publicaciones que desaparecen de Instagram ───────────────────────

type SyncLogFn = (level: "INFO" | "WARN" | "ERROR", eventType: string, message: string, postId?: string | null, details?: Prisma.InputJsonValue) => Promise<unknown>;

/**
 * Instagram no informa ventas: la señal disponible es que la publicación se borre o archive.
 * - Vehículo visible cuya publicación (dentro de `since`) no aparece → suma una ausencia;
 *   al llegar a `afterMisses` seguidas se retira (WITHDRAWN). Fotos y datos se conservan.
 * - Si la publicación vuelve a aparecer: se reinicia el contador y, si el retiro fue
 *   automático y nadie cambió el estado después, el vehículo vuelve a AVAILABLE.
 */
export async function reconcileMissing(
  db: PrismaClient,
  seenIds: Set<string>,
  since: Date,
  rule: { afterMisses: number; maxPerRun: number },
  log: SyncLogFn,
): Promise<{ missing: number; withdrawn: number; restored: number }> {
  const out = { missing: 0, withdrawn: 0, restored: 0 };
  const seen = [...seenIds];

  // Reaparecidas: reiniciar contador y deshacer retiros automáticos.
  const back = await db.instagramPost.findMany({
    where: { instagramMediaId: { in: seen }, OR: [{ missingCount: { gt: 0 } }, { autoWithdrawnAt: { not: null } }] },
    include: { vehicle: { select: { id: true, status: true } } },
  });
  for (const post of back) {
    const restore = post.autoWithdrawnAt && post.vehicle?.status === "WITHDRAWN";
    await db.$transaction([
      db.instagramPost.update({ where: { id: post.id }, data: { missingCount: 0, autoWithdrawnAt: null } }),
      ...(restore
        ? [
            db.vehicle.update({ where: { id: post.vehicle!.id }, data: { status: "AVAILABLE" } }),
            db.auditLog.create({
              data: { action: "vehicle.auto_restored", entityType: "Vehicle", entityId: post.vehicle!.id, details: { instagramMediaId: post.instagramMediaId, via: "sync" } },
            }),
          ]
        : []),
    ]);
    if (restore) {
      out.restored++;
      await log("INFO", "vehicle.restored", "Publicación visible otra vez en Instagram: vehículo restaurado", post.id);
    }
  }

  // Ausentes: solo vehículos visibles importados de publicaciones dentro de la ventana.
  const absent = await db.instagramPost.findMany({
    where: {
      instagramMediaId: { notIn: seen },
      publishedAt: { gte: since },
      vehicle: { is: { published: true, status: { in: ["AVAILABLE", "RESERVED"] } } },
    },
    include: { vehicle: { select: { id: true, status: true, make: true, model: true, year: true } } },
  });
  out.missing = absent.length;
  if (!absent.length) return out;
  if (seen.length === 0 || absent.length > rule.maxPerRun) {
    await log("WARN", "sync.missing_anomaly", `Faltan ${absent.length} publicaciones de vehículos visibles: posible anomalía de la API, no se retira nada`, null, {
      missing: absent.length,
      seen: seen.length,
      maxPerRun: rule.maxPerRun,
    });
    return out;
  }

  for (const post of absent) {
    const v = post.vehicle!;
    const misses = post.missingCount + 1;
    const label = [v.make, v.model, v.year].filter(Boolean).join(" ");
    if (misses < rule.afterMisses) {
      await db.instagramPost.update({ where: { id: post.id }, data: { missingCount: misses } });
      await log("WARN", "post.missing", `${label}: la publicación no aparece en Instagram (${misses}/${rule.afterMisses})`, post.id);
      continue;
    }
    await db.$transaction([
      db.instagramPost.update({ where: { id: post.id }, data: { missingCount: misses, autoWithdrawnAt: new Date() } }),
      db.vehicle.update({ where: { id: v.id }, data: { status: "WITHDRAWN" } }),
      db.auditLog.create({
        data: {
          action: "vehicle.auto_withdrawn",
          entityType: "Vehicle",
          entityId: v.id,
          details: { instagramMediaId: post.instagramMediaId, previousStatus: v.status, misses, via: "sync" },
        },
      }),
    ]);
    out.withdrawn++;
    await log("WARN", "vehicle.withdrawn", `${label} retirado: la publicación ya no está en Instagram`, post.id);
  }
  return out;
}

// ─── Procesamiento de una publicación ─────────────────────────────────

interface ProcessArgs {
  db: PrismaClient;
  client: SyncDeps["client"];
  storage: ObjectStorage;
  download: typeof downloadImage;
  log: (level: "INFO" | "WARN" | "ERROR", eventType: string, message: string, postId?: string | null, details?: Prisma.InputJsonValue) => Promise<unknown>;
  opts: SyncOptions;
  media: IgMedia;
  existing: InstagramPost | null;
  usedBytes: number;
}

interface ProcessOutcome {
  result: "published" | "pending" | "skipped";
  vehicle?: "created" | "updated";
  uploaded: number;
  reused: number;
  removed: number;
  bytesAdded: number;
}

async function processPost(a: ProcessArgs): Promise<ProcessOutcome> {
  const { db, media } = a;
  const outcome: ProcessOutcome = { result: "skipped", uploaded: 0, reused: 0, removed: 0, bytesAdded: 0 };

  const children: IgChildMedia[] =
    media.media_type === "CAROUSEL_ALBUM" ? await a.client.getAllChildren(media) : [];
  const hash = contentHash(media, children.map((c) => c.id));

  const post = await db.instagramPost.upsert({
    where: { instagramMediaId: media.id },
    create: {
      instagramMediaId: media.id,
      permalink: media.permalink ?? null,
      caption: media.caption ?? null,
      contentHash: hash,
      mediaType: media.media_type,
      publishedAt: new Date(media.timestamp),
      syncStatus: "PROCESSING",
      attempts: 1,
    },
    update: {
      permalink: media.permalink ?? null,
      caption: media.caption ?? null,
      contentHash: hash,
      mediaType: media.media_type,
      syncStatus: "PROCESSING",
      attempts: { increment: 1 },
    },
  });

  const finish = async (syncStatus: "SUCCESS" | "PENDING" | "SKIPPED", lastError: string | null) => {
    await db.instagramPost.update({ where: { id: post.id }, data: { syncStatus, lastError, processedAt: new Date() } });
  };

  // 1) Solo imágenes: un video no se trata como foto.
  if (media.media_type === "VIDEO") {
    await finish("SKIPPED", "Video: solo se importan publicaciones con imágenes");
    await a.log("INFO", "post.skipped", "Video omitido", post.id);
    return outcome;
  }

  // 2) Extracción del caption.
  const parsed = parseCaption(media.caption);
  if (!looksLikeVehicle(parsed)) {
    await finish("SKIPPED", "No parece una publicación de vehículo (sin marca identificable)");
    await a.log("INFO", "post.skipped", "Publicación sin vehículo identificable", post.id, { warnings: parsed.warnings });
    return outcome;
  }
  if (!parsed.vehicle.make || !parsed.vehicle.model) {
    await finish("PENDING", "No se pudo identificar marca y modelo con certeza");
    await a.log("WARN", "caption.incomplete", "Marca/modelo no identificados", post.id, { warnings: parsed.warnings });
    outcome.result = "pending";
    return outcome;
  }

  // 3) Imágenes en orden estable (orden del carrusel).
  const sources: IgChildMedia[] =
    media.media_type === "IMAGE"
      ? [{ id: media.id, media_type: "IMAGE", media_url: media.media_url }]
      : children.filter((c) => c.media_type === "IMAGE");
  const skippedVideos = children.length - sources.length;
  const capped = sources.slice(0, a.opts.maxImagesPerPost);
  if (skippedVideos > 0) await a.log("INFO", "media.video_skipped", `${skippedVideos} video(s) del carrusel omitidos`, post.id);

  const existingVehicle = await db.vehicle.findUnique({
    where: { instagramPostId: post.id },
    include: { images: true },
  });
  const knownImages = new Map((existingVehicle?.images ?? []).filter((i) => i.instagramMediaId).map((i) => [i.instagramMediaId!, i]));

  const stored: { childId: string; key: string; url: string; bytes: number | null; contentType: string | null }[] = [];
  for (const src of capped) {
    const known = knownImages.get(src.id);
    if (known) {
      stored.push({ childId: src.id, key: known.storageKey, url: a.storage.publicUrl(known.storageKey), bytes: known.bytes, contentType: known.contentType });
      outcome.reused++;
      continue;
    }
    if (!src.media_url) {
      await a.log("WARN", "media.missing_url", "Imagen sin media_url en la respuesta de la API", post.id, { childId: src.id });
      continue;
    }
    const file = await a.download(src.media_url);
    if (a.usedBytes + outcome.bytesAdded + file.bytes.byteLength > a.opts.maxStorageBytes) {
      throw new Error("Tope de almacenamiento propio alcanzado: no se suben más imágenes (protección del plan gratuito de R2)");
    }
    const key = instagramImageKey(media.id, src.id, file.ext);
    await a.storage.put(key, file.bytes, file.contentType);
    outcome.uploaded++;
    outcome.bytesAdded += file.bytes.byteLength;
    stored.push({ childId: src.id, key, url: a.storage.publicUrl(key), bytes: file.bytes.byteLength, contentType: file.contentType });
    await a.log("INFO", "media.uploaded", "Imagen almacenada en R2", post.id, { key, host: describeUrl(src.media_url) });
  }

  // 4) Reglas de publicación.
  const blockers = publishBlockers(parsed.vehicle, stored.length, parsed);
  const postDate = new Date(media.timestamp);
  if (!a.opts.autoPublishSince || postDate < a.opts.autoPublishSince) {
    blockers.push("Disponibilidad no confirmada (publicación anterior al inicio de la publicación automática): requiere validación");
  }
  const canPublish = blockers.length === 0;
  const locked = existingVehicle?.lockedFields ?? [];
  const data = vehicleDataFromCaption(media.caption, parsed.vehicle, locked);
  const extraction = {
    parsedAt: new Date().toISOString(),
    provenance: parsed.provenance,
    warnings: parsed.warnings,
    blockers,
  } as unknown as Prisma.InputJsonValue;
  const altBase = [parsed.vehicle.make, parsed.vehicle.model, parsed.vehicle.year].filter(Boolean).join(" ");

  // 5) Persistencia atómica: vehículo + imágenes.
  const removedKeys = await db.$transaction(async (tx) => {
    let vehicleId: string;
    if (existingVehicle) {
      // Publicado se mantiene (puede haberlo publicado el panel); no se despublica en silencio.
      const publish = canPublish && !existingVehicle.published;
      await tx.vehicle.update({
        where: { id: existingVehicle.id },
        data: {
          ...data,
          extraction,
          ...(publish ? { published: true, publishedAt: existingVehicle.publishedAt ?? new Date(media.timestamp) } : {}),
        },
      });
      vehicleId = existingVehicle.id;
      outcome.vehicle = "updated";
    } else {
      const created = await tx.vehicle.create({
        data: {
          ...(data as Prisma.VehicleUncheckedCreateInput),
          make: parsed.vehicle.make!,
          model: parsed.vehicle.model!,
          slug: vehicleSlug({ ...parsed.vehicle, make: parsed.vehicle.make!, model: parsed.vehicle.model! }, media.id),
          source: "INSTAGRAM",
          status: "AVAILABLE",
          published: canPublish,
          publishedAt: canPublish ? new Date(media.timestamp) : null,
          extraction,
          instagramPostId: post.id,
        },
      });
      vehicleId = created.id;
      outcome.vehicle = "created";
    }

    for (const [position, img] of stored.entries()) {
      await tx.vehicleImage.upsert({
        where: { vehicleId_instagramMediaId: { vehicleId, instagramMediaId: img.childId } },
        create: {
          vehicleId,
          instagramMediaId: img.childId,
          storageKey: img.key,
          publicUrl: img.url,
          bytes: img.bytes,
          contentType: img.contentType,
          position,
          altText: `${altBase} – foto ${position + 1}`,
        },
        update: { position, publicUrl: img.url },
      });
    }
    // Imágenes que ya no están en la publicación de Instagram (las subidas a mano se conservan).
    const keep = stored.map((s) => s.childId);
    const stale = await tx.vehicleImage.findMany({
      where: { vehicleId, instagramMediaId: { not: null, notIn: keep } },
      select: { id: true, storageKey: true },
    });
    if (stale.length) await tx.vehicleImage.deleteMany({ where: { id: { in: stale.map((s) => s.id) } } });
    return stale.map((s) => s.storageKey);
  });

  for (const key of removedKeys) {
    await a.storage.delete(key).catch(() => a.log("WARN", "media.delete_failed", "No se pudo borrar imagen antigua de R2", post.id, { key }));
    outcome.removed++;
  }

  if (canPublish || existingVehicle?.published) {
    await finish("SUCCESS", null);
    outcome.result = "published";
    await a.log("INFO", "vehicle.published", `${altBase} publicado`, post.id);
  } else {
    await finish("PENDING", blockers.join(". "));
    outcome.result = "pending";
    await a.log("WARN", "vehicle.pending", `${altBase} guardado sin publicar: ${blockers.join(". ")}`, post.id, { blockers });
  }
  return outcome;
}
