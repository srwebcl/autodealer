import type { Prisma, PrismaClient } from "@/generated/prisma/client";
import { publicImageUrl } from "@/lib/storage/public-url";
import { vehicleTitle } from "@/lib/utils/format";
import {
  buildVehicleOrderBy,
  buildVehicleWhere,
  CATALOG_STATUSES,
  type CatalogFilters,
  PAGE_SIZE,
  publicVehicleBase,
} from "@/lib/vehicles/filters";
import { drivetrainLabels, fuelTypeLabels, transmissionLabels } from "@/lib/vehicles/labels";
import type { CommercialContent } from "@/lib/instagram/commercial-content";
import { buildSearchDoc, type SearchItem } from "@/lib/vehicles/search";
import type { VehicleCardData, VehicleDetailData } from "@/types/vehicle";

function asContent(value: unknown): CommercialContent | null {
  return value && typeof value === "object" && (value as { version?: unknown }).version === 1 ? (value as CommercialContent) : null;
}

/**
 * Consultas del catálogo público. Reciben el cliente como parámetro para poder
 * probarse contra la base sin `server-only` ni caché de Next.
 */
type Db = Pick<PrismaClient, "vehicle">;

const cardSelect = {
  id: true,
  slug: true,
  make: true,
  model: true,
  version: true,
  year: true,
  mileageKm: true,
  priceClp: true,
  transmission: true,
  fuelType: true,
  status: true,
  images: { orderBy: { position: "asc" }, take: 1, select: { storageKey: true, altText: true } },
} satisfies Prisma.VehicleSelect;

type CardRow = Prisma.VehicleGetPayload<{ select: typeof cardSelect }>;

function altFor(v: { make: string; model: string; year: number | null }, custom?: string | null) {
  return custom || [vehicleTitle(v), v.year].filter(Boolean).join(" ");
}

export function toCard(row: CardRow): VehicleCardData {
  const first = row.images[0];
  const src = first ? publicImageUrl(first.storageKey) : null;
  return {
    id: row.id,
    slug: row.slug,
    make: row.make,
    model: row.model,
    version: row.version,
    year: row.year,
    mileageKm: row.mileageKm,
    priceClp: row.priceClp,
    transmission: row.transmission ? transmissionLabels[row.transmission] : null,
    fuelType: row.fuelType ? fuelTypeLabels[row.fuelType] : null,
    status: row.status,
    image: src ? { src, alt: altFor(row, first?.altText) } : null,
  };
}

export async function listVehicles(db: Db, filters: CatalogFilters, matchSlugs?: string[]) {
  const where = buildVehicleWhere(filters, matchSlugs);
  const total = await db.vehicle.count({ where });
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const page = Math.min(filters.pagina, pageCount);
  const rows = await db.vehicle.findMany({
    where,
    orderBy: buildVehicleOrderBy(filters.orden),
    skip: (page - 1) * PAGE_SIZE,
    take: PAGE_SIZE,
    select: cardSelect,
  });
  return { vehicles: rows.map(toCard), total, page, pageCount, pageSize: PAGE_SIZE };
}

export async function listFeatured(db: Db, limit: number) {
  const rows = await db.vehicle.findMany({
    where: publicVehicleBase(),
    orderBy: buildVehicleOrderBy("recientes"),
    take: limit,
    select: cardSelect,
  });
  return rows.map(toCard);
}

/** Índice compacto del catálogo público para la búsqueda inteligente (más recientes primero). */
export async function listSearchIndex(db: Db): Promise<SearchItem[]> {
  const rows = await db.vehicle.findMany({
    where: publicVehicleBase(),
    orderBy: buildVehicleOrderBy("recientes"),
    select: { ...cardSelect, drivetrain: true, color: true, engine: true, description: true },
  });
  return rows.map((row) => {
    const card = toCard(row);
    return {
      slug: card.slug,
      make: card.make,
      model: card.model,
      version: card.version ?? null,
      year: card.year ?? null,
      priceClp: card.priceClp ?? null,
      mileageKm: card.mileageKm ?? null,
      fuelType: card.fuelType ?? null,
      transmission: card.transmission ?? null,
      status: card.status,
      image: card.image ?? null,
      doc: buildSearchDoc({
        ...row,
        fuelType: card.fuelType,
        transmission: card.transmission,
        drivetrain: row.drivetrain ? drivetrainLabels[row.drivetrain] : null,
      }),
    };
  });
}

/** Opciones de filtro basadas solo en datos existentes del catálogo público. */
export async function getFacets(db: Db) {
  const where = publicVehicleBase();
  const [makes, fuels, transmissions, drivetrains, ranges] = await Promise.all([
    db.vehicle.groupBy({ by: ["make"], where, _count: { _all: true }, orderBy: { make: "asc" } }),
    db.vehicle.groupBy({ by: ["fuelType"], where: { ...where, fuelType: { not: null } }, _count: { _all: true } }),
    db.vehicle.groupBy({ by: ["transmission"], where: { ...where, transmission: { not: null } }, _count: { _all: true } }),
    db.vehicle.groupBy({ by: ["drivetrain"], where: { ...where, drivetrain: { not: null } }, _count: { _all: true } }),
    db.vehicle.aggregate({
      where,
      _min: { year: true, priceClp: true },
      _max: { year: true, priceClp: true, mileageKm: true },
    }),
  ]);
  return {
    makes: makes.map((m) => ({ value: m.make, count: m._count._all })),
    fuelTypes: fuels.flatMap((f) => (f.fuelType ? [{ value: f.fuelType, count: f._count._all }] : [])),
    transmissions: transmissions.flatMap((t) => (t.transmission ? [{ value: t.transmission, count: t._count._all }] : [])),
    drivetrains: drivetrains.flatMap((d) => (d.drivetrain ? [{ value: d.drivetrain, count: d._count._all }] : [])),
    yearMin: ranges._min.year,
    yearMax: ranges._max.year,
    priceMin: ranges._min.priceClp,
    priceMax: ranges._max.priceClp,
    mileageMax: ranges._max.mileageKm,
  };
}

export type CatalogFacets = Awaited<ReturnType<typeof getFacets>>;

/**
 * Ficha pública. Se muestran disponibles, reservados y vendidos (estos con aviso y
 * sin indexar, para no romper enlaces compartidos). Retirados o no publicados: null.
 */
export async function findVehicleBySlug(db: Db, slug: string): Promise<VehicleDetailData | null> {
  const row = await db.vehicle.findFirst({
    where: {
      slug,
      published: true,
      status: { in: [...CATALOG_STATUSES, "SOLD"] },
    },
    include: {
      images: { orderBy: { position: "asc" } },
      instagramPost: { select: { permalink: true } },
    },
  });
  if (!row) return null;

  const images = row.images.flatMap((img) => {
    const src = publicImageUrl(img.storageKey);
    return src ? [{ src, alt: altFor(row, img.altText), width: img.width, height: img.height }] : [];
  });
  const features = Array.isArray(row.features) ? row.features.filter((x): x is string => typeof x === "string") : [];

  return {
    ...toCard({ ...row, images: row.images.slice(0, 1) }),
    engine: row.engine,
    drivetrain: row.drivetrain ? drivetrainLabels[row.drivetrain] : null,
    color: row.color,
    description: row.description,
    features,
    images,
    instagramPermalink: row.instagramPost?.permalink ?? null,
    content: asContent(row.content),
    publishedAt: row.publishedAt,
    updatedAt: row.updatedAt,
  };
}

/** Relacionados: misma marca primero; si faltan, rango de precio similar. */
export async function listRelated(
  db: Db,
  v: { id: string; make: string; priceClp?: number | null },
  limit: number,
) {
  const base = { ...publicVehicleBase(), id: { not: v.id } };
  const sameMake = await db.vehicle.findMany({
    where: { ...base, make: { equals: v.make, mode: "insensitive" } },
    orderBy: buildVehicleOrderBy("recientes"),
    take: limit,
    select: cardSelect,
  });
  let rows = sameMake;
  if (rows.length < limit) {
    const exclude = [v.id, ...rows.map((r) => r.id)];
    const price = v.priceClp;
    const others = await db.vehicle.findMany({
      where: {
        ...publicVehicleBase(),
        id: { notIn: exclude },
        ...(price ? { priceClp: { gte: Math.round(price * 0.7), lte: Math.round(price * 1.3) } } : {}),
      },
      orderBy: buildVehicleOrderBy("recientes"),
      take: limit - rows.length,
      select: cardSelect,
    });
    rows = [...rows, ...others];
  }
  return rows.map(toCard);
}

/** Para sitemap y generateStaticParams: solo fichas indexables. */
export async function listIndexableSlugs(db: Db) {
  return db.vehicle.findMany({
    where: publicVehicleBase(),
    select: { slug: true, updatedAt: true },
    orderBy: { publishedAt: "desc" },
  });
}
