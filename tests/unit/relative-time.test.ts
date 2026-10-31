import { describe, expect, it } from "vitest";
import { relativeAgo } from "@/lib/utils/relative-time";

const now = Date.parse("2026-10-30T15:00:00Z");

describe("relativeAgo (estilo Google)", () => {
  it.each([
    ["2026-10-30", "Hoy"],
    ["2026-10-29", "Hace un día"],
    ["2026-10-26", "Hace 4 días"],
    ["2026-10-23", "Hace una semana"],
    ["2026-10-09", "Hace 3 semanas"],
    ["2026-09-28", "Hace un mes"],
    ["2026-08-28", "Hace 2 meses"],
    ["2025-12-28", "Hace 10 meses"],
    ["2025-10-30", "Hace un año"],
    ["2023-10-30", "Hace 3 años"],
    ["2027-01-01", "Hoy"], // fecha futura: no muestra tiempos negativos
  ])("%s → %s", (date, expected) => {
    expect(relativeAgo(date, now)).toBe(expected);
  });
});
