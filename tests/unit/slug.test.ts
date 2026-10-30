import { describe, expect, it } from "vitest";
import { slugify, vehicleSlug } from "@/lib/utils/slug";

describe("slugify", () => {
  it("quita tildes, eñes y símbolos", () => {
    expect(slugify("  Peugeot 208 Allure — Año 2021 ñandú!! ")).toBe("peugeot-208-allure-ano-2021-nandu");
  });
  it("cumple el formato exigido por la base", () => {
    expect(slugify("Mazda CX-5 2.5 GT")).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
  });
});

describe("vehicleSlug", () => {
  it("combina marca, modelo, versión y año", () => {
    expect(vehicleSlug({ make: "Mazda", model: "CX-5", version: "2.5 GT", year: 2021 })).toBe("mazda-cx-5-2-5-gt-2021");
  });
  it("omite campos ausentes sin inventarlos", () => {
    expect(vehicleSlug({ make: "Toyota", model: "Hilux", version: null, year: null })).toBe("toyota-hilux");
  });
  it("añade un sufijo estable para evitar colisiones", () => {
    const a = vehicleSlug({ make: "Kia", model: "Rio" }, "17912345678901234");
    const b = vehicleSlug({ make: "Kia", model: "Rio" }, "17912345678901234");
    expect(a).toBe(b);
    expect(a).toBe("kia-rio-78901234");
  });
  it("falla si no hay marca ni modelo", () => {
    expect(() => vehicleSlug({ make: "", model: "" })).toThrow();
  });
});
