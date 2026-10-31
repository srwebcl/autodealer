import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { db } from "@/lib/db";
import type { CatalogFilters } from "@/lib/vehicles/filters";
import { searchVehicles } from "@/lib/vehicles/search";
import * as repo from "./repository";

/** Etiqueta de caché del inventario. El panel y la sync la invalidan al cambiar datos. */
export const VEHICLES_TAG = "vehicles";

export async function getCatalogPage(filters: CatalogFilters) {
  "use cache";
  cacheTag(VEHICLES_TAG);
  cacheLife("hours");
  // El texto libre se resuelve con la misma búsqueda inteligente del inicio.
  const matchSlugs = filters.q ? searchVehicles(await getSearchIndex(), filters.q).results.map((v) => v.slug) : undefined;
  return repo.listVehicles(db, filters, matchSlugs);
}

export async function getSearchIndex() {
  "use cache";
  cacheTag(VEHICLES_TAG);
  cacheLife("hours");
  return repo.listSearchIndex(db);
}

export async function getCatalogFacets() {
  "use cache";
  cacheTag(VEHICLES_TAG);
  cacheLife("hours");
  return repo.getFacets(db);
}

export async function getFeaturedVehicles(limit = 6) {
  "use cache";
  cacheTag(VEHICLES_TAG);
  cacheLife("hours");
  return repo.listFeatured(db, limit);
}

export async function getVehicleBySlug(slug: string) {
  "use cache";
  cacheTag(VEHICLES_TAG, `vehicle:${slug}`);
  cacheLife("hours");
  return repo.findVehicleBySlug(db, slug);
}

export async function getRelatedVehicles(v: { id: string; make: string; priceClp?: number | null }) {
  "use cache";
  cacheTag(VEHICLES_TAG);
  cacheLife("hours");
  return repo.listRelated(db, v, 3);
}

export async function getIndexableSlugs() {
  "use cache";
  cacheTag(VEHICLES_TAG);
  cacheLife("hours");
  return repo.listIndexableSlugs(db);
}
