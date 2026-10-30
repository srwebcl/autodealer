import { describe, expect, it } from "vitest";
import {
  looksLikeVehicle,
  parseCaption,
  parseChileanInteger,
  parseMileage,
  parsePrice,
  parseYear,
  publishBlockers,
} from "@/lib/instagram/parse-caption";

// Captions sintéticos. Se reemplazarán/ampliarán con captions reales de @autodealer.cl.

describe("normalización de números chilenos", () => {
  it.each([
    ["113.118", 113118],
    ["113 118", 113118],
    ["113 mil", 113000],
    ["85k", 85000],
    ["14,5 millones", 14500000],
    ["2020", 2020],
  ])("%s → %d", (raw, n) => expect(parseChileanInteger(raw)).toBe(n));

  it("precio exige rango razonable", () => {
    expect(parsePrice("$14.590.000")).toBe(14590000);
    expect(parsePrice("14.590")).toBeNull(); // ¿miles? ambiguo → no se adivina
    expect(parsePrice("Conversable")).toBeNull();
  });
  it("año válido", () => {
    expect(parseYear("Modelo 2019")).toBe(2019);
    expect(parseYear("1899")).toBeNull();
    expect(parseYear("3000")).toBeNull();
  });
  it("kilometraje", () => {
    expect(parseMileage("113.118 km")).toBe(113118);
    expect(parseMileage("sin dato")).toBeNull();
  });
});

describe("parseCaption con etiquetas", () => {
  const caption = `🚗 TOYOTA RAV4 2.0 LIMITED 2021
✅ Marca: Toyota
✅ Modelo: RAV4
✅ Versión: 2.0 Limited
✅ Año: 2021
✅ Kilometraje: 45.300 km
✅ Motor: 2.0 Bencina
✅ Transmisión: Automática
✅ Tracción: 4x4
✅ Color: gris oscuro
💰 Precio: $22.990.000
Equipamiento:
- Cámara de retroceso
- Apple CarPlay
Único dueño, mantenciones en concesionario.
📍 Av. Balmaceda 1595, La Serena
#autodealer #toyota #rav4`;

  const r = parseCaption(caption);

  it("extrae todos los campos etiquetados", () => {
    expect(r.vehicle).toMatchObject({
      make: "Toyota",
      model: "RAV4",
      version: "2.0 Limited",
      year: 2021,
      mileageKm: 45300,
      priceClp: 22990000,
      engine: "2.0 Bencina",
      fuelType: "GASOLINE",
      transmission: "AUTOMATIC",
      drivetrain: "FOUR_WD",
      color: "Gris Oscuro",
    });
    expect(r.provenance.priceClp?.source).toBe("label");
  });
  it("equipamiento y descripción sin hashtags", () => {
    expect(r.vehicle.features).toEqual(["Cámara de retroceso", "Apple CarPlay"]);
    expect(r.vehicle.description).toContain("Único dueño");
    expect(r.vehicle.description).not.toContain("#autodealer");
  });
  it("es publicable con imágenes", () => {
    expect(publishBlockers(r.vehicle, 3)).toEqual([]);
    expect(publishBlockers(r.vehicle, 0)).toEqual(["Sin imágenes almacenadas"]);
  });
});

describe("parseCaption formato libre", () => {
  it("toma marca/modelo/año del título y precio/km por patrón", () => {
    const r = parseCaption(`MAZDA CX-5 2.5 GT AWD 2020
Impecable, 61.000 kms, automática.
Valor $18.490.000 conversable
#mazda`);
    expect(r.vehicle).toMatchObject({ make: "Mazda", model: "CX-5", version: "2.5 GT AWD", year: 2020, mileageKm: 61000, priceClp: 18490000, transmission: "AUTOMATIC", drivetrain: "AWD" });
    expect(r.provenance.make?.source).toBe("title");
  });

  it("alias de marca (VW, Mercedes)", () => {
    expect(parseCaption("VW Golf GTI 2019").vehicle.make).toBe("Volkswagen");
    expect(parseCaption("Mercedes Benz C200 2018").vehicle.make).toBe("Mercedes-Benz");
  });

  it("no inventa datos ausentes", () => {
    const r = parseCaption("Kia Morning, consulta por precio y disponibilidad");
    expect(r.vehicle.make).toBe("Kia");
    expect(r.vehicle.year).toBeUndefined();
    expect(r.vehicle.priceClp).toBeUndefined();
    expect(publishBlockers(r.vehicle, 2)[0]).toMatch(/año, precio/);
  });

  it("caption ambiguo bloquea la publicación aunque haya datos", () => {
    const r = parseCaption("Modelo: Toyota Yaris\nAño: 2020\nPrecio: conversable\nValor $9.990.000");
    expect(publishBlockers(r.vehicle, 3, r).join()).toMatch(/Caption ambiguo: Precio no interpretable/);
  });

  it("marca no reconocida bloquea por interpretación", () => {
    const r = parseCaption("Marca: Zxqauto\nModelo: Z1\nAño: 2022\nPrecio: $9.990.000");
    expect(publishBlockers(r.vehicle, 3, r).join()).toMatch(/Marca no reconocida/);
  });

  it("caption bien interpretado no tiene bloqueos", () => {
    const r = parseCaption("Modelo: Hyundai Tucson\nAño: 2018\nPrecio: $14.590.000");
    expect(publishBlockers(r.vehicle, 3, r)).toEqual([]);
  });

  it("varios precios → ninguno (ambiguo)", () => {
    const r = parseCaption("Hyundai Tucson 2019\nAntes $15.990.000 ahora $14.990.000");
    expect(r.vehicle.priceClp).toBeUndefined();
    expect(r.warnings.join()).toMatch(/Varios precios/);
  });

  it("transmisión ambigua → se omite", () => {
    expect(parseCaption("Nissan Versa 2018 disponible manual y automático").vehicle.transmission).toBeUndefined();
  });

  it("no confunde el año con kilometraje ni precio", () => {
    const r = parseCaption("Suzuki Swift 2021");
    expect(r.vehicle.mileageKm).toBeUndefined();
    expect(r.vehicle.priceClp).toBeUndefined();
  });

  it("publicaciones que no son vehículos", () => {
    expect(looksLikeVehicle(parseCaption("¡Feliz 18! Atendemos hasta las 14:00 🇨🇱"))).toBe(false);
    expect(looksLikeVehicle(parseCaption(""))).toBe(false);
  });

  it("letras decorativas Unicode", () => {
    expect(parseCaption("𝗧𝗢𝗬𝗢𝗧𝗔 𝗛𝗜𝗟𝗨𝗫 2020").vehicle).toMatchObject({ make: "Toyota", model: "Hilux", year: 2020 });
  });
});
