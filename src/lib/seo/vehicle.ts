import { siteConfig } from "@/config/site";
import { formatClp, formatKm, vehicleTitle } from "@/lib/utils/format";
import type { VehicleDetailData, VehicleStatus } from "@/types/vehicle";

/** "Mazda CX-5 2.5 GT AWD 2021" — solo con los datos presentes. */
export function vehicleDisplayName(v: Pick<VehicleDetailData, "make" | "model" | "version" | "year">): string {
  return [vehicleTitle(v), v.version, v.year].filter(Boolean).join(" ");
}

export function vehicleMetaDescription(v: VehicleDetailData): string {
  const facts = [
    v.year ? String(v.year) : null,
    formatKm(v.mileageKm),
    v.transmission?.toLowerCase(),
    v.fuelType?.toLowerCase(),
  ].filter(Boolean);
  const price = formatClp(v.priceClp);
  const parts = [`${vehicleTitle(v)}${v.version ? ` ${v.version}` : ""}${facts.length ? `: ${facts.join(", ")}` : ""}.`];
  if (v.status === "SOLD") parts.push("Vendido.");
  else if (price) parts.push(`Precio ${price}.`);
  parts.push(`En ${siteConfig.name}, ${siteConfig.city}.`);
  return parts.join(" ");
}

const availability: Record<VehicleStatus, string | null> = {
  AVAILABLE: "https://schema.org/InStock",
  RESERVED: "https://schema.org/LimitedAvailability",
  SOLD: "https://schema.org/SoldOut",
  WITHDRAWN: null,
};

const fuelSchema: Record<string, string> = {
  Bencina: "Gasoline",
  Diésel: "Diesel",
  Eléctrico: "Electric",
};

/**
 * Datos estructurados schema.org/Car. Solo propiedades con datos reales y
 * visibles en la ficha; la oferta se omite si no hay precio.
 */
export function vehicleJsonLd(v: VehicleDetailData, url: string): Record<string, unknown> {
  const data: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Car",
    name: vehicleDisplayName(v),
    url,
    brand: { "@type": "Brand", name: v.make },
    model: v.model,
  };
  if (v.version) data.vehicleConfiguration = v.version;
  if (v.year) data.vehicleModelDate = String(v.year);
  if (v.mileageKm != null) data.mileageFromOdometer = { "@type": "QuantitativeValue", value: v.mileageKm, unitCode: "KMT" };
  if (v.fuelType) data.fuelType = fuelSchema[v.fuelType] ?? v.fuelType;
  if (v.transmission) data.vehicleTransmission = v.transmission;
  if (v.drivetrain) data.driveWheelConfiguration = v.drivetrain;
  if (v.engine) data.vehicleEngine = { "@type": "EngineSpecification", name: v.engine };
  if (v.color) data.color = v.color;
  if (v.description) data.description = v.description;
  if (v.images.length) data.image = v.images.map((i) => i.src);

  const avail = availability[v.status];
  if (v.priceClp != null && avail) {
    data.offers = {
      "@type": "Offer",
      price: v.priceClp,
      priceCurrency: "CLP",
      availability: avail,
      itemCondition: "https://schema.org/UsedCondition",
      url,
      seller: { "@type": "AutoDealer", name: siteConfig.name, address: siteConfig.address },
    };
  }
  return data;
}

/** Serializa JSON-LD evitando que un "<" en datos cierre el <script>. */
export function serializeJsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
