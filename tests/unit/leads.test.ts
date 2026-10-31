import { describe, expect, it } from "vitest";
import { formatChileanPhone, leadWhatsappMessage, normalizeChileanPhone, normalizePlate, parseLead } from "@/lib/leads/schema";

describe("teléfono chileno", () => {
  it.each([
    ["+56 9 6754 6248", "+56967546248"],
    ["967546248", "+56967546248"],
    ["56967546248", "+56967546248"],
    ["(9) 6754-6248", "+56967546248"],
    ["222334455", "+56222334455"],
  ])("%s → %s", (raw, e164) => expect(normalizeChileanPhone(raw)).toBe(e164));

  it.each(["12345", "+1 555 123 4567", "9675462", ""])("rechaza %s", (raw) => expect(normalizeChileanPhone(raw)).toBeNull());

  it("formatea para mostrar", () => expect(formatChileanPhone("+56967546248")).toBe("+56 9 6754 6248"));
});

describe("patente", () => {
  it.each([
    ["bc-df-12", "BCDF12"],
    ["AB1234", "AB1234"],
    ["ab·12·34", "AB1234"],
  ])("%s → %s", (raw, p) => expect(normalizePlate(raw)).toBe(p));
  it.each(["123456", "ABCDEFG", "A1"])("rechaza %s", (raw) => expect(normalizePlate(raw)).toBeNull());
});

describe("parseLead", () => {
  it("financiamiento válido con campos opcionales vacíos", () => {
    const r = parseLead("financiamiento", { nombre: " Ana Pérez ", telefono: "9 1234 5678", email: "", vehiculo: "", pie: "Sin pie", trabajador: "nada" });
    expect(r).toEqual({ ok: true, lead: { form: "financiamiento", data: { nombre: "Ana Pérez", telefono: "+56912345678", pie: "Sin pie" } } });
  });

  it("errores por campo, en español", () => {
    const r = parseLead("financiamiento", { nombre: "A", telefono: "123", email: "no-es-email" });
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(Object.keys(r.fieldErrors).sort()).toEqual(["email", "nombre", "telefono"]);
      expect(r.fieldErrors.telefono).toMatch(/teléfono válido/);
    }
  });

  it("seguro exige vehículo; normaliza patente y año", () => {
    expect(parseLead("seguro", { nombre: "Luis", telefono: "967546248" })).toMatchObject({ ok: false, fieldErrors: { vehiculo: expect.any(String) } });
    const r = parseLead("seguro", { nombre: "Luis", telefono: "967546248", vehiculo: "Toyota Hilux", anio: "2020", patente: "ab-cd-12" });
    expect(r).toMatchObject({ ok: true, lead: { data: { anio: 2020, patente: "ABCD12" } } });
  });

  it("año fuera de rango y formulario desconocido", () => {
    expect(parseLead("seguro", { nombre: "Luis", telefono: "967546248", vehiculo: "Kia", anio: "1890" })).toMatchObject({ ok: false, fieldErrors: { anio: "Año no válido" } });
    expect(parseLead("otro", {})).toMatchObject({ ok: false });
  });
});

describe("mensaje de WhatsApp", () => {
  it("solo incluye los datos entregados", () => {
    const r = parseLead("seguro", { nombre: "Luis", telefono: "967546248", vehiculo: "Toyota Hilux", anio: "2020" });
    if (!r.ok) throw new Error("debió validar");
    const msg = leadWhatsappMessage(r.lead);
    expect(msg).toContain("BCI Seguros");
    expect(msg).toContain("Vehículo: Toyota Hilux 2020");
    expect(msg).not.toContain("Patente");
    expect(msg).not.toContain("967546248"); // el teléfono no se repite: WhatsApp ya lo identifica
  });
});

describe("vende tu auto y contacto", () => {
  it("vende exige vehículo y año; normaliza kilometraje y patente", () => {
    expect(parseLead("vende", { nombre: "Luis", telefono: "967546248", vehiculo: "Kia Rio" })).toMatchObject({
      ok: false,
      fieldErrors: { anio: "Indica el año" },
    });
    const r = parseLead("vende", {
      nombre: "Luis",
      telefono: "967546248",
      vehiculo: "Kia Rio",
      anio: "2019",
      kilometraje: "85.000 km",
      patente: "ab-cd-12",
      modalidad: "Dejarlo en consignación",
    });
    expect(r).toMatchObject({ ok: true, lead: { data: { anio: 2019, kilometraje: 85000, patente: "ABCD12", modalidad: "Dejarlo en consignación" } } });
    if (!r.ok) throw new Error("debió validar");
    expect(leadWhatsappMessage(r.lead)).toContain("Kilometraje: 85.000 km");
  });

  it("kilometraje no numérico", () => {
    expect(parseLead("vende", { nombre: "Luis", telefono: "967546248", vehiculo: "Kia", anio: "2019", kilometraje: "mucho" })).toMatchObject({
      ok: false,
      fieldErrors: { kilometraje: expect.any(String) },
    });
  });

  it("contacto exige mensaje; motivo desconocido se descarta", () => {
    expect(parseLead("contacto", { nombre: "Ana", telefono: "967546248", mensaje: "" })).toMatchObject({ ok: false, fieldErrors: { mensaje: expect.any(String) } });
    const r = parseLead("contacto", { nombre: "Ana", telefono: "967546248", motivo: "otra cosa", mensaje: "¿Tienen camionetas 4x4?" });
    expect(r).toEqual({ ok: true, lead: { form: "contacto", data: { nombre: "Ana", telefono: "+56967546248", mensaje: "¿Tienen camionetas 4x4?" } } });
    if (!r.ok) throw new Error("debió validar");
    expect(leadWhatsappMessage(r.lead)).toBe("Hola AutoDealer.\nNombre: Ana\n¿Tienen camionetas 4x4?");
  });
});
