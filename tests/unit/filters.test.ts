import { describe, expect, it } from "vitest";
import {
  buildVehicleOrderBy,
  buildVehicleWhere,
  countActiveFilters,
  filtersToSearch,
  parseCatalogFilters,
} from "@/lib/vehicles/filters";

describe("parseCatalogFilters", () => {
  it("valores por defecto", () => {
    const f = parseCatalogFilters({});
    expect(f.orden).toBe("recientes");
    expect(f.pagina).toBe(1);
    expect(countActiveFilters(f)).toBe(0);
  });

  it("convierte números y enums válidos", () => {
    const f = parseCatalogFilters({ anioMin: "2019", precioMax: "20000000", combustible: "diesel", orden: "precio-asc", pagina: "3" });
    expect(f).toMatchObject({ anioMin: 2019, precioMax: 20000000, combustible: "diesel", orden: "precio-asc", pagina: 3 });
  });

  it("ignora valores inválidos o maliciosos sin fallar", () => {
    const f = parseCatalogFilters({
      anioMin: "abc",
      precioMax: "-5",
      combustible: "nuclear",
      orden: "'; DROP TABLE",
      pagina: "0",
      kmMax: "1e99",
    });
    expect(f.anioMin).toBeUndefined();
    expect(f.precioMax).toBeUndefined();
    expect(f.combustible).toBeUndefined();
    expect(f.kmMax).toBeUndefined();
    expect(f.orden).toBe("recientes");
    expect(f.pagina).toBe(1);
  });

  it("toma el primer valor de parámetros repetidos e ignora vacíos", () => {
    const f = parseCatalogFilters({ marca: ["Mazda", "Kia"], q: "", precioMax: "" });
    expect(f.marca).toBe("Mazda");
    expect(f.q).toBeUndefined();
    expect(f.precioMax).toBeUndefined();
  });

  it("recorta texto largo", () => {
    expect(parseCatalogFilters({ q: "x".repeat(200) }).q).toBeUndefined();
  });
});

describe("filtersToSearch", () => {
  it("omite valores por defecto y conserva el resto", () => {
    const f = parseCatalogFilters({ marca: "Mazda", orden: "recientes", pagina: "1" });
    expect(filtersToSearch(f)).toBe("?marca=Mazda");
  });
  it("es reversible", () => {
    const f = parseCatalogFilters({ q: "cx 5", anioMin: "2020", orden: "km-asc", pagina: "2" });
    const back = parseCatalogFilters(Object.fromEntries(new URLSearchParams(filtersToSearch(f))));
    expect(back).toEqual(f);
  });
});

describe("buildVehicleWhere", () => {
  it("siempre restringe a publicados y estados visibles", () => {
    const where = buildVehicleWhere(parseCatalogFilters({}));
    expect(where.AND).toEqual([{ published: true, status: { in: ["AVAILABLE", "RESERVED"] } }]);
  });
  it("combina filtros", () => {
    const where = buildVehicleWhere(
      parseCatalogFilters({ q: "cx 5", anioMin: "2019", precioMax: "20000000", transmision: "automatica" }));
    const and = where.AND as object[];
    expect(and).toHaveLength(1 + 2 + 1 + 1 + 1); // base + 2 palabras + año + precio + transmisión
    expect(and).toContainEqual({ year: { gte: 2019, lte: undefined } });
    expect(and).toContainEqual({ transmission: "AUTOMATIC" });
  });
});

describe("buildVehicleOrderBy", () => {
  it("deja sin precio al final y desempata por id", () => {
    expect(buildVehicleOrderBy("precio-asc")).toEqual([{ priceClp: { sort: "asc", nulls: "last" } }, { id: "asc" }]);
  });
});
