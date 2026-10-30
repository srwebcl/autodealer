import { describe, expect, it } from "vitest";
import { formatClp, formatKm } from "@/lib/utils/format";

// Intl puede usar espacios no separables; se normalizan para comparar.
const norm = (s: string | null) => s?.replace(/\s/g, " ") ?? null;

describe("formatClp", () => {
  it("formatea con separador de miles chileno", () => {
    expect(norm(formatClp(14590000))).toBe("$14.590.000");
  });
  it("redondea decimales", () => {
    expect(norm(formatClp(999.6))).toBe("$1.000");
  });
  it("devuelve null para valores ausentes o inválidos", () => {
    expect(formatClp(null)).toBeNull();
    expect(formatClp(undefined)).toBeNull();
    expect(formatClp(Number.NaN)).toBeNull();
    expect(formatClp(-1)).toBeNull();
  });
});

describe("formatKm", () => {
  it("formatea kilometraje", () => {
    expect(norm(formatKm(113118))).toBe("113.118 km");
  });
  it("acepta 0 km", () => {
    expect(norm(formatKm(0))).toBe("0 km");
  });
  it("devuelve null si falta", () => {
    expect(formatKm(null)).toBeNull();
  });
});
