import { describe, expect, it } from "vitest";
import { buildSearchDoc, describeQuery, parseQuery, searchVehicles } from "@/lib/vehicles/search";

const v = (slug: string, data: Parameters<typeof buildSearchDoc>[0] & { priceClp?: number; mileageKm?: number }) => ({
  slug,
  year: data.year ?? null,
  priceClp: data.priceClp ?? null,
  mileageKm: data.mileageKm ?? null,
  doc: buildSearchDoc(data),
});

const items = [
  v("ranger", { make: "Ford", model: "Ranger", version: "Limited", year: 2023, fuelType: "Diésel", transmission: "Automática", drivetrain: "4x4", priceClp: 29_990_000, description: "¡La camioneta definitiva para viajes!" }),
  v("f150", { make: "Ford", model: "F-150", version: "XLT", year: 2024, transmission: "Automática", drivetrain: "4x4", priceClp: 34_590_000, description: "¡Poder y estampa pura! Una bestia americana." }),
  v("tucson", { make: "Hyundai", model: "Tucson", year: 2018, fuelType: "Diésel", transmission: "Manual", priceClp: 14_590_000, mileageKm: 120_000, description: "¿Buscas una SUV espaciosa? Una de las camionetas familiares más vendidas." }),
  v("mazda3", { make: "Mazda", model: "3", version: "Sport Hatchback", year: 2018, fuelType: "Bencina", transmission: "Automática", priceClp: 11_490_000, mileageKm: 70_000, description: "¿Buscas un hatchback con presencia?" }),
  v("p208", { make: "Peugeot", model: "208", year: 2013, fuelType: "Diésel", transmission: "Manual", priceClp: 4_990_000, description: "¿Buscas un auto económico?" }),
];
const find = (q: string) => searchVehicles(items, q).results.map((r) => r.slug);

describe("parseQuery", () => {
  it("entiende precio, año y kilometraje", () => {
    expect(parseQuery("camioneta hasta 15 millones")).toMatchObject({ tokens: ["camioneta"], priceMax: 15_000_000 });
    expect(parseQuery("suv desde $10.000.000")).toMatchObject({ tokens: ["suv"], priceMin: 10_000_000 });
    expect(parseQuery("menos de 12")).toMatchObject({ priceMax: 12_000_000 });
    expect(parseQuery("desde 2020")).toMatchObject({ tokens: [], yearMin: 2020 });
    expect(parseQuery("menos de 80 mil km")).toMatchObject({ kmMax: 80_000 });
  });
  it("deja los números de modelo como palabras", () => {
    expect(parseQuery("peugeot 208").tokens).toEqual(["peugeot", "208"]);
    expect(parseQuery("Mazda 3").tokens).toEqual(["mazda", "3"]);
  });
  it("describe los rangos entendidos", () => {
    expect(describeQuery(parseQuery("hasta 15 millones desde 2020"))).toEqual(["Hasta $15.000.000", "Año 2020 o más nuevo"]);
  });
});

describe("searchVehicles", () => {
  it("tipo de vehículo desde la descripción y modelos conocidos", () => {
    expect(find("camioneta").sort()).toEqual(["f150", "ranger"]);
    expect(find("pickup").sort()).toEqual(["f150", "ranger"]);
    expect(find("suv")).toEqual(["tucson"]);
    expect(find("hatchback")).toEqual(["mazda3"]);
  });
  it("sinónimos, plurales y tildes", () => {
    expect(find("camionetas automaticas").sort()).toEqual(["f150", "ranger"]);
    expect(find("petrolero manual").sort()).toEqual(["p208", "tucson"]);
    expect(find("gasolina")).toEqual(["mazda3"]);
  });
  it("tolera errores de tipeo y guiones", () => {
    expect(find("fors ranger")).toEqual(["ranger"]);
    expect(find("hyundia")).toEqual(["tucson"]);
    expect(find("f150")).toEqual(["f150"]);
    expect(find("F-150")).toEqual(["f150"]);
  });
  it("combina palabras y rangos", () => {
    expect(find("diesel hasta 15 millones").sort()).toEqual(["p208", "tucson"]);
    expect(find("automatico menos de 100 mil km")).toEqual(["mazda3"]);
    expect(find("mazda 3")).toEqual(["mazda3"]);
  });
  it("sin coincidencias o sin criterio no devuelve nada", () => {
    expect(find("lamborghini")).toEqual([]);
    expect(find("   ")).toEqual([]);
  });
});
