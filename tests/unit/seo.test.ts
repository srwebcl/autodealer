import { describe, expect, it } from "vitest";
import { serializeJsonLd, vehicleDisplayName, vehicleJsonLd, vehicleMetaDescription } from "@/lib/seo/vehicle";
import type { VehicleDetailData } from "@/types/vehicle";

const base: VehicleDetailData = {
  id: "1",
  slug: "mazda-cx-5-2021",
  make: "Mazda",
  model: "CX-5",
  version: "2.5 GT",
  year: 2021,
  mileageKm: 48500,
  priceClp: 18990000,
  transmission: "Automática",
  fuelType: "Bencina",
  status: "AVAILABLE",
  engine: null,
  drivetrain: null,
  color: null,
  description: null,
  features: [],
  images: [],
  instagramPermalink: null,
  publishedAt: null,
  updatedAt: new Date(0),
};
const norm = (s: string) => s.replace(/\s/g, " ");

describe("vehicleDisplayName / description", () => {
  it("nombre con datos presentes", () => {
    expect(vehicleDisplayName(base)).toBe("Mazda CX-5 2.5 GT 2021");
    expect(vehicleDisplayName({ ...base, version: null, year: null })).toBe("Mazda CX-5");
  });
  it("descripción no inventa precio ni km ausentes", () => {
    const d = vehicleMetaDescription({ ...base, priceClp: null, mileageKm: null });
    expect(d).not.toMatch(/Precio|km/);
    expect(norm(vehicleMetaDescription(base))).toContain("Precio $18.990.000");
  });
  it("vendido no muestra precio", () => {
    expect(vehicleMetaDescription({ ...base, status: "SOLD" })).toContain("Vendido");
  });
});

describe("vehicleJsonLd", () => {
  it("incluye oferta solo con precio", () => {
    expect(vehicleJsonLd(base, "u").offers).toMatchObject({ price: 18990000, priceCurrency: "CLP", availability: "https://schema.org/InStock" });
    expect(vehicleJsonLd({ ...base, priceClp: null }, "u").offers).toBeUndefined();
  });
  it("omite propiedades ausentes", () => {
    const ld = vehicleJsonLd({ ...base, mileageKm: null, year: null }, "u");
    expect(ld).not.toHaveProperty("mileageFromOdometer");
    expect(ld).not.toHaveProperty("vehicleModelDate");
    expect(ld).not.toHaveProperty("image");
  });
  it("vendido marca SoldOut", () => {
    expect((vehicleJsonLd({ ...base, status: "SOLD" }, "u").offers as { availability: string }).availability).toBe(
      "https://schema.org/SoldOut",
    );
  });
});

describe("serializeJsonLd", () => {
  it("escapa < para no cerrar el script", () => {
    expect(serializeJsonLd({ d: "</script><script>alert(1)</script>" })).not.toContain("<");
  });
});
