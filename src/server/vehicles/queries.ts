import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { db } from "@/lib/db";
import type { CatalogFilters } from "@/lib/vehicles/filters";
import * as repo from "./repository";

/** Etiqueta de caché del inventario. El panel y la sync la invalidan al cambiar datos. */
export const VEHICLES_TAG = "vehicles";

/** Los datos demo nunca se muestran en el entorno de producción de Vercel. */
const includeDemo = process.env.VERCEL_ENV !== "production";

export async function getCatalogPage(filters: CatalogFilters) {
  "use cache";
  cacheTag(VEHICLES_TAG);
  cacheLife("hours");
  return repo.listVehicles(db, filters, includeDemo);
}

export async function getCatalogFacets() {
  "use cache";
  cacheTag(VEHICLES_TAG);
  cacheLife("hours");
  return repo.getFacets(db, includeDemo);
}

export async function getFeaturedVehicles(limit = 6) {
  "use cache";
  cacheTag(VEHICLES_TAG);
  cacheLife("hours");
  return repo.listFeatured(db, limit, includeDemo);
}

export async function getVehicleBySlug(slug: string) {
  "use cache";
  cacheTag(VEHICLES_TAG, `vehicle:${slug}`);
  cacheLife("hours");
  return repo.findVehicleBySlug(db, slug, includeDemo);
}

export async function getRelatedVehicles(v: { id: string; make: string; priceClp?: number | null }) {
  "use cache";
  cacheTag(VEHICLES_TAG);
  cacheLife("hours");
  return repo.listRelated(db, v, 3, includeDemo);
}

export async function getIndexableSlugs() {
  "use cache";
  cacheTag(VEHICLES_TAG);
  cacheLife("hours");
  return repo.listIndexableSlugs(db, includeDemo);
}
