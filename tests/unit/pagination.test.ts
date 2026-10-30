import { describe, expect, it } from "vitest";
import { pageWindow } from "@/components/vehicles/pagination";
import { publicImageUrl } from "@/lib/storage/public-url";

describe("pageWindow", () => {
  it("pocas páginas sin saltos", () => {
    expect(pageWindow(1, 3)).toEqual([1, 2, 3]);
  });
  it("saltos alrededor de la actual", () => {
    expect(pageWindow(5, 10)).toEqual([1, "gap", 4, 5, 6, "gap", 10]);
  });
  it("extremos", () => {
    expect(pageWindow(1, 10)).toEqual([1, 2, "gap", 10]);
    expect(pageWindow(10, 10)).toEqual([1, "gap", 9, 10]);
  });
});

describe("publicImageUrl", () => {
  it("null sin R2 configurado", () => {
    expect(publicImageUrl("a/b.jpg", undefined)).toBeNull();
  });
  it("une base y clave codificando segmentos", () => {
    expect(publicImageUrl("vehiculos/abc/foto 1.jpg", "https://img.autodealer.cl/")).toBe(
      "https://img.autodealer.cl/vehiculos/abc/foto%201.jpg",
    );
  });
});
