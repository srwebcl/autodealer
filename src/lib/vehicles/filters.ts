import { z } from "zod";
import type { Prisma } from "@/generated/prisma/client";
import type { Drivetrain, FuelType, Transmission } from "@/generated/prisma/enums";

/** Estados visibles en el catálogo público. Vendidos y retirados nunca aparecen como disponibles. */
export const CATALOG_STATUSES = ["AVAILABLE", "RESERVED"] as const;

export const PAGE_SIZE = 12;

// Valores de URL en español ↔ enums de la base.
export const fuelParam = {
  bencina: "GASOLINE",
  diesel: "DIESEL",
  hibrido: "HYBRID",
  "hibrido-enchufable": "PLUG_IN_HYBRID",
  electrico: "ELECTRIC",
  gas: "GAS",
} as const satisfies Record<string, FuelType>;

export const transmissionParam = {
  manual: "MANUAL",
  automatica: "AUTOMATIC",
} as const satisfies Record<string, Transmission>;

export const drivetrainParam = {
  "4x4": "FOUR_WD",
  "4x2": "TWO_WD",
  awd: "AWD",
  delantera: "FWD",
  trasera: "RWD",
} as const satisfies Record<string, Drivetrain>;

export const SORT_OPTIONS = {
  recientes: "Más recientes",
  "precio-asc": "Menor precio",
  "precio-desc": "Mayor precio",
  "anio-desc": "Más nuevos",
  "km-asc": "Menor kilometraje",
} as const;

export type SortKey = keyof typeof SORT_OPTIONS;

const keysOf = <T extends object>(o: T) => Object.keys(o) as [keyof T & string, ...(keyof T & string)[]];

// Un valor inválido se ignora (undefined) en vez de romper la página.
const optionalInt = (min: number, max: number) =>
  z.coerce.number().int().min(min).max(max).optional().catch(undefined);

const optionalText = z
  .string()
  .trim()
  .max(60)
  .transform((v) => v || undefined)
  .optional()
  .catch(undefined);

export const catalogFiltersSchema = z.object({
  q: optionalText,
  marca: optionalText,
  anioMin: optionalInt(1900, 2100),
  anioMax: optionalInt(1900, 2100),
  precioMin: optionalInt(0, 2_000_000_000),
  precioMax: optionalInt(0, 2_000_000_000),
  kmMax: optionalInt(0, 10_000_000),
  combustible: z.enum(keysOf(fuelParam)).optional().catch(undefined),
  transmision: z.enum(keysOf(transmissionParam)).optional().catch(undefined),
  traccion: z.enum(keysOf(drivetrainParam)).optional().catch(undefined),
  orden: z.enum(keysOf(SORT_OPTIONS)).default("recientes").catch("recientes"),
  pagina: z.coerce.number().int().min(1).max(10_000).default(1).catch(1),
});

export type CatalogFilters = z.infer<typeof catalogFiltersSchema>;

type RawSearchParams = Record<string, string | string[] | undefined>;

/** Convierte searchParams (posiblemente repetidos o vacíos) en filtros validados. */
export function parseCatalogFilters(raw: RawSearchParams): CatalogFilters {
  const flat: Record<string, string> = {};
  for (const [key, value] of Object.entries(raw)) {
    const first = Array.isArray(value) ? value[0] : value;
    if (first !== undefined && first !== "") flat[key] = first;
  }
  return catalogFiltersSchema.parse(flat);
}

/** Claves que restringen resultados (excluye orden y página). */
export const FILTER_KEYS = [
  "q",
  "marca",
  "anioMin",
  "anioMax",
  "precioMin",
  "precioMax",
  "kmMax",
  "combustible",
  "transmision",
  "traccion",
] as const satisfies (keyof CatalogFilters)[];

export function countActiveFilters(f: CatalogFilters): number {
  return FILTER_KEYS.filter((k) => f[k] !== undefined).length;
}

/** Serializa filtros a query string, omitiendo valores por defecto. */
export function filtersToSearch(f: Partial<CatalogFilters>): string {
  const params = new URLSearchParams();
  for (const key of FILTER_KEYS) {
    const value = f[key];
    if (value !== undefined) params.set(key, String(value));
  }
  if (f.orden && f.orden !== "recientes") params.set("orden", f.orden);
  if (f.pagina && f.pagina > 1) params.set("pagina", String(f.pagina));
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

export function publicVehicleBase(): Prisma.VehicleWhereInput {
  return { published: true, status: { in: [...CATALOG_STATUSES] } };
}

/** Construye el WHERE de Prisma. Solo usa valores validados; Prisma parametriza la consulta. */
export function buildVehicleWhere(f: CatalogFilters, matchSlugs?: string[]): Prisma.VehicleWhereInput {
  const and: Prisma.VehicleWhereInput[] = [publicVehicleBase()];

  // Con búsqueda inteligente (ver search.ts) el texto ya viene resuelto como lista de slugs.
  if (f.q && matchSlugs) and.push({ slug: { in: matchSlugs } });
  else if (f.q) {
    // Cada palabra debe aparecer en marca, modelo o versión.
    for (const word of f.q.split(/\s+/).filter(Boolean).slice(0, 5)) {
      and.push({
        OR: [
          { make: { contains: word, mode: "insensitive" } },
          { model: { contains: word, mode: "insensitive" } },
          { version: { contains: word, mode: "insensitive" } },
        ],
      });
    }
  }
  if (f.marca) and.push({ make: { equals: f.marca, mode: "insensitive" } });
  if (f.anioMin !== undefined || f.anioMax !== undefined) and.push({ year: { gte: f.anioMin, lte: f.anioMax } });
  if (f.precioMin !== undefined || f.precioMax !== undefined)
    and.push({ priceClp: { gte: f.precioMin, lte: f.precioMax } });
  if (f.kmMax !== undefined) and.push({ mileageKm: { lte: f.kmMax } });
  if (f.combustible) and.push({ fuelType: fuelParam[f.combustible] });
  if (f.transmision) and.push({ transmission: transmissionParam[f.transmision] });
  if (f.traccion) and.push({ drivetrain: drivetrainParam[f.traccion] });

  return { AND: and };
}

export function buildVehicleOrderBy(sort: SortKey): Prisma.VehicleOrderByWithRelationInput[] {
  // `id` como desempate: paginación estable.
  switch (sort) {
    case "precio-asc":
      return [{ priceClp: { sort: "asc", nulls: "last" } }, { id: "asc" }];
    case "precio-desc":
      return [{ priceClp: { sort: "desc", nulls: "last" } }, { id: "asc" }];
    case "anio-desc":
      return [{ year: { sort: "desc", nulls: "last" } }, { publishedAt: "desc" }, { id: "asc" }];
    case "km-asc":
      return [{ mileageKm: { sort: "asc", nulls: "last" } }, { id: "asc" }];
    default:
      return [{ publishedAt: { sort: "desc", nulls: "last" } }, { id: "asc" }];
  }
}
