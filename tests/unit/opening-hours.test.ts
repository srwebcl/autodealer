import { describe, expect, it } from "vitest";
import { describeStatus, localClock, openingStatus } from "@/lib/utils/opening-hours";

const schedule = [
  { days: [1, 2, 3, 4, 5], open: "08:30", close: "18:30" },
  { days: [6], open: "10:00", close: "14:00" },
];
const at = (day: number, hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  return describeStatus(openingStatus(schedule, day, h * 60 + m));
};

describe("horario de atención", () => {
  it("abierto dentro del horario", () => {
    expect(at(3, "12:00")).toEqual({ label: "Abierto ahora", detail: "Cierra a las 18:30" });
    expect(at(6, "10:00")).toEqual({ label: "Abierto ahora", detail: "Cierra a las 14:00" });
  });
  it("cerrado: indica cuándo abre", () => {
    expect(at(3, "07:00")).toEqual({ label: "Cerrado", detail: "Abre hoy a las 08:30" });
    expect(at(3, "18:30")).toEqual({ label: "Cerrado", detail: "Abre mañana a las 08:30" });
    expect(at(5, "19:00")).toEqual({ label: "Cerrado", detail: "Abre mañana a las 10:00" });
    expect(at(6, "15:00")).toEqual({ label: "Cerrado", detail: "Abre el lunes a las 08:30" });
    expect(at(0, "11:00")).toEqual({ label: "Cerrado", detail: "Abre mañana a las 08:30" });
  });
  it("usa la hora de Santiago", () => {
    // 2026-10-31 15:00 UTC = sábado 12:00 en Santiago (UTC-3, horario de verano).
    expect(localClock(new Date("2026-10-31T15:00:00Z"), "America/Santiago")).toEqual({ day: 6, minute: 720 });
  });
});
