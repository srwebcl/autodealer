export const VEHICLE_STATUSES = ["AVAILABLE", "RESERVED", "SOLD", "WITHDRAWN"] as const;
export type VehicleStatus = (typeof VEHICLE_STATUSES)[number];

/**
 * Datos mínimos que necesita una tarjeta de catálogo.
 * Los campos opcionales pueden faltar en la publicación original:
 * se omiten o se muestran como "Consultar", nunca se completan por suposición.
 */
export interface VehicleCardData {
  id: string;
  slug: string;
  make: string;
  model: string;
  version?: string | null;
  year?: number | null;
  mileageKm?: number | null;
  priceClp?: number | null;
  transmission?: string | null;
  fuelType?: string | null;
  status: VehicleStatus;
  image?: { src: string; alt: string } | null;
  /** true solo para datos ficticios de maqueta. */
  isDemo?: boolean;
}

import type { CommercialContent } from "@/lib/instagram/commercial-content";

export interface VehicleImageData {
  src: string;
  alt: string;
  width?: number | null;
  height?: number | null;
}

/** Ficha completa para /vehiculos/[slug]. Campos ausentes = null (nunca inventados). */
export interface VehicleDetailData extends VehicleCardData {
  engine: string | null;
  drivetrain: string | null;
  color: string | null;
  description: string | null;
  features: string[];
  images: VehicleImageData[];
  instagramPermalink: string | null;
  /** Descripción comercial estructurada desde el caption (null si no hay). */
  content: CommercialContent | null;
  publishedAt: Date | null;
  updatedAt: Date;
}
