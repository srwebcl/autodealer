import { describe, expect, it } from "vitest";
import { looksLikeVehicle, parseCaption, splitMakeModel } from "@/lib/instagram/parse-caption";

// Formato real de @autodealer.cl (fragmentos de captions públicos, octubre 2026).

const TUCSON = `🚙🔥 ¡ESPACIO, RENDIMIENTO Y CONFIABILIDAD COREANA: HYUNDAI TUCSON 2.0 CRDI DIESEL 2018! 🔥⛽
¿Buscas una SUV espaciosa, económica para viajar y con mecánica probada?

📋 FICHA TÉCNICA:
Modelo: Hyundai Tucson
Año: 2018
Kilometraje: 113.118 km
Motor: 2.0L CRDi Turbo Diésel
Transmisión: Manual de 6 velocidades
Tracción: Delantera
Precio: $14.590.000

✨ EQUIPAMIENTO DESTACADO:
🖥️ Tecnología a Bordo: Pantalla multimedia táctil con conectividad Bluetooth.
💳 Financiamiento: Evaluamos tu crédito automotriz rápido y con opciones a tu medida.
🚗 Recibimos tu vehículo: Tomamos tu auto o camioneta en parte de pago.
#autodealer #hyundai`;

const MAXUS = `🔥 ¡DISPONIBLE EN AUTODEALER! 🔥

MAXUS T60 4X4 2023 – MOTOR 2.8 TURBO DIÉSEL: MÁXIMA FUERZA Y RENDIMIENTO 🛻💨

📋 FICHA TÉCNICA Y DETALLES:
Año: 2023

Kilometraje: 93.645 km

Motor: 2.8 Turbo Diésel (gran torque en baja)

Tracción: 4x4 con selector electrónico (4x2 / 4x4 High / 4x4 Low)

Transmisión: Mecánica

Versión: Trabajo / Básica (Doble Cabina, resistente y confiable)

💰 VALOR CONTADO / OFERTA:
$12.690.000`;

describe("splitMakeModel", () => {
  it.each([
    ["Hyundai Tucson", { make: "Hyundai", model: "Tucson" }],
    ["Mazda 3 Sport Hatchback", { make: "Mazda", model: "3", version: "Sport Hatchback" }],
    ["JAC T8 XE Advance 4x4", { make: "JAC", model: "T8", version: "XE Advance 4x4" }],
    ["Citroën C3 Feel / Shine 1.2", { make: "Citroën", model: "C3", version: "Feel / Shine 1.2" }],
    ["SWM G05 Pro", { make: "SWM", model: "G05", version: "Pro" }],
    ["Exeed LX Advanced", { make: "Exeed", model: "LX", version: "Advanced" }],
    ["Suzuki Grand Vitara 2.4", { make: "Suzuki", model: "Grand Vitara", version: "2.4" }],
  ])("%s", (raw, expected) => expect(splitMakeModel(raw)).toEqual(expected));

  it("null si no empieza con una marca", () => {
    expect(splitMakeModel("Tucson 2.0")).toBeNull();
  });
});

describe("caption real: Hyundai Tucson", () => {
  const r = parseCaption(TUCSON);
  it("extrae la ficha técnica", () => {
    expect(r.vehicle).toMatchObject({
      make: "Hyundai",
      model: "Tucson",
      year: 2018,
      mileageKm: 113118,
      priceClp: 14590000,
      engine: "2.0L CRDi Turbo Diésel",
      fuelType: "DIESEL",
      transmission: "MANUAL",
      drivetrain: "FWD",
    });
    expect(r.vehicle.version).toBeUndefined(); // no se inventa a partir del titular
  });
  it("descripción sin avisos comerciales ni titular", () => {
    expect(r.vehicle.description).toContain("SUV espaciosa");
    expect(r.vehicle.description).toContain("Pantalla multimedia");
    expect(r.vehicle.description).not.toMatch(/Financiamiento|Recibimos tu vehículo|#autodealer|ESPACIO, RENDIMIENTO/);
  });
});

describe("caption real: Maxus sin etiqueta Modelo", () => {
  const r = parseCaption(MAXUS);
  it("toma marca y modelo del titular y la versión de la etiqueta", () => {
    expect(looksLikeVehicle(r)).toBe(true);
    expect(r.vehicle).toMatchObject({
      make: "Maxus",
      model: "T60",
      version: "Trabajo / Básica (Doble Cabina, resistente y confiable)",
      year: 2023,
      mileageKm: 93645,
      transmission: "MANUAL",
      drivetrain: "FOUR_WD", // primera mención en "4x4 con selector (4x2 / 4x4…)"
      fuelType: "DIESEL",
    });
  });
  it("precio en la línea siguiente a 'VALOR CONTADO / OFERTA:'", () => {
    expect(r.vehicle.priceClp).toBe(12690000);
    expect(r.provenance.priceClp?.source).toBe("label");
  });
});

describe("variantes de etiqueta", () => {
  it("'Precio de Ocasión:'", () => {
    expect(parseCaption("Modelo: Peugeot 208\nAño: 2013\nPrecio de Ocasión: $4.990.000").vehicle.priceClp).toBe(4990000);
  });
  it("'Tracción: 4x2' no se infiere como delantera ni trasera", () => {
    expect(parseCaption("Modelo: Peugeot Landtrek 4x2\nTracción: 4x2").vehicle.drivetrain).toBe("TWO_WD");
  });
  it("'Tracción: 4x4 (2H / 4H / 4L)' → 4x4", () => {
    expect(parseCaption("Modelo: JAC T8\nTracción: 4x4 (2H / 4H / 4L)").vehicle.drivetrain).toBe("FOUR_WD");
  });
  it("sin kilometraje en el caption → null (no se inventa)", () => {
    const v = parseCaption("Modelo: Ford F-150 XLT (75 Años)\nAño: 2024\nPrecio: $34.590.000").vehicle;
    expect(v).toMatchObject({ make: "Ford", model: "F-150", version: "XLT (75 Años)" });
    expect(v.mileageKm).toBeUndefined();
  });
});
