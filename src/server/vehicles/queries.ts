import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { db } from "@/lib/db";
import type { CatalogFilters } from "@/lib/vehicles/filters";
import * as repo from "./repository";

/** Etiqueta de caché del inventario. El panel y la sync la invalidan al cambiar datos. */
export const VEHICLES_TAG = "vehicles";

export async function getCatalogPage(filters: CatalogFilters) {
  "use cache";
  cacheTag(VEHICLES_TAG);
  cacheLife("hours");
  return repo.listVehicles(db, filters);
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
