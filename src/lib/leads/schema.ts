import { z } from "zod";

/** Tipo de formulario (valor del campo oculto "tipo") ↔ enum de la base. */
export const LEAD_FORMS = { financiamiento: "FINANCING", seguro: "INSURANCE", vende: "SELL", contacto: "CONTACT" } as const;
export type LeadForm = keyof typeof LEAD_FORMS;

export const DOWN_PAYMENT_OPTIONS = ["Sin pie", "Hasta $2.000.000", "$2.000.000 a $5.000.000", "Más de $5.000.000"] as const;
export const WORKER_OPTIONS = ["Dependiente", "Independiente", "Pensionado"] as const;
export const SELL_MODE_OPTIONS = ["Dejarlo en consignación", "Parte de pago por otro auto", "Aún no lo sé"] as const;
export const CONTACT_TOPIC_OPTIONS = ["Comprar un vehículo", "Vender o consignar mi auto", "Financiamiento", "Seguro", "Otro"] as const;

/** "+56 9 1234 5678", "912345678", "56912345678" → "+56912345678". Solo móviles y fijos de 9 dígitos. */
export function normalizeChileanPhone(raw: string): string | null {
  let d = raw.replace(/\D/g, "");
  if (d.startsWith("56") && d.length === 11) d = d.slice(2);
  return /^\d{9}$/.test(d) ? `+56${d}` : null;
}

/** "+56912345678" → "+56 9 1234 5678". */
export function formatChileanPhone(e164: string): string {
  const d = e164.replace(/^\+56/, "");
  return d.length === 9 ? `+56 ${d[0]} ${d.slice(1, 5)} ${d.slice(5)}` : e164;
}

/** Patente chilena: "ab-cd-12", "abcd12", "AB1234" → "ABCD12". Formatos antiguos (AB1234) y nuevos (BCDF12). */
export function normalizePlate(raw: string): string | null {
  const p = raw.toUpperCase().replace(/[^A-Z0-9]/g, "");
  return /^([A-Z]{2}\d{4}|[A-Z]{4}\d{2}|[A-Z]{2}[A-Z0-9]{2}\d{2})$/.test(p) ? p : null;
}

const trimmed = (max: number) => z.string().trim().max(max, `Máximo ${max} caracteres`);
const optional = (max: number) =>
  trimmed(max)
    .optional()
    .transform((v) => (v ? v : undefined));

const base = z.object({
  nombre: trimmed(80).min(2, "Ingresa tu nombre"),
  telefono: z
    .string()
    .trim()
    .transform((v, ctx) => {
      const phone = normalizeChileanPhone(v);
      if (!phone) ctx.addIssue({ code: "custom", message: "Ingresa un teléfono válido, por ejemplo +56 9 1234 5678" });
      return phone ?? "";
    }),
  email: z
    .string({ error: "Ingresa tu email" })
    .trim()
    .min(1, "Ingresa tu email")
    .max(120)
    .transform((v) => v.toLowerCase())
    .pipe(z.email("Email no válido, por ejemplo nombre@correo.cl")),
  mensaje: optional(1000),
});

const financing = base.extend({
  vehiculo: optional(120),
  pie: z.enum(DOWN_PAYMENT_OPTIONS).optional().catch(undefined),
  trabajador: z.enum(WORKER_OPTIONS).optional().catch(undefined),
});

const currentYear = new Date().getFullYear();
const year = (required: boolean) =>
  z
    .string()
    .trim()
    .optional()
    .transform((v, ctx) => {
      if (!v) {
        if (required) ctx.addIssue({ code: "custom", message: "Indica el año" });
        return undefined;
      }
      const n = Number(v);
      if (!Number.isInteger(n) || n < 1980 || n > currentYear + 1) {
        ctx.addIssue({ code: "custom", message: "Año no válido" });
        return undefined;
      }
      return n;
    });
const plate = z
  .string()
  .trim()
  .optional()
  .transform((v, ctx) => {
    if (!v) return undefined;
    const p = normalizePlate(v);
    if (!p) ctx.addIssue({ code: "custom", message: "Patente no válida (ej. BCDF12 o AB1234)" });
    return p ?? undefined;
  });
/** "85.000", "85000 km" → 85000. */
const mileage = z
  .string()
  .trim()
  .optional()
  .transform((v, ctx) => {
    if (!v) return undefined;
    const digits = v.replace(/km/i, "").replace(/[.\s]/g, "");
    const n = Number(digits);
    if (!/^\d+$/.test(digits) || n > 2_000_000) {
      ctx.addIssue({ code: "custom", message: "Kilometraje no válido (ej. 85.000)" });
      return undefined;
    }
    return n;
  });

const insurance = base.extend({
  vehiculo: trimmed(120).min(2, "Indica la marca y el modelo"),
  anio: year(false),
  patente: plate,
});

const sell = base.extend({
  vehiculo: trimmed(120).min(2, "Indica la marca y el modelo"),
  anio: year(true),
  kilometraje: mileage,
  patente: plate,
  modalidad: z.enum(SELL_MODE_OPTIONS).optional().catch(undefined),
});

const contact = base.extend({
  motivo: z.enum(CONTACT_TOPIC_OPTIONS).optional().catch(undefined),
  mensaje: trimmed(1000).min(5, "Escribe tu mensaje"),
});

export const leadSchemas = { financiamiento: financing, seguro: insurance, vende: sell, contacto: contact } as const;
export type FinancingLead = z.infer<typeof financing>;
export type InsuranceLead = z.infer<typeof insurance>;
export type SellLead = z.infer<typeof sell>;
export type ContactLead = z.infer<typeof contact>;
export type ParsedLead =
  | { form: "financiamiento"; data: FinancingLead }
  | { form: "seguro"; data: InsuranceLead }
  | { form: "vende"; data: SellLead }
  | { form: "contacto"; data: ContactLead };

export type LeadParseResult =
  | { ok: true; lead: ParsedLead }
  | { ok: false; fieldErrors: Record<string, string> };

/** Valida los campos de un formulario. Ignora campos desconocidos. */
export function parseLead(form: string, raw: Record<string, unknown>): LeadParseResult {
  if (!(form in leadSchemas)) return { ok: false, fieldErrors: { tipo: "Formulario desconocido" } };
  const f = form as LeadForm;
  const r = leadSchemas[f].safeParse(raw);
  if (!r.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of r.error.issues) {
      const key = String(issue.path[0] ?? "form");
      fieldErrors[key] ??= issue.message;
    }
    return { ok: false, fieldErrors };
  }
  return { ok: true, lead: { form: f, data: r.data } as ParsedLead };
}

const km = (n: number) => `${n.toLocaleString("es-CL")} km`;

/** Resumen para WhatsApp: el cliente puede enviarlo para una respuesta inmediata. */
export function leadWhatsappMessage(lead: ParsedLead): string {
  let lines: (string | null)[];
  switch (lead.form) {
    case "financiamiento": {
      const d = lead.data;
      lines = [
        "Hola AutoDealer, quiero cotizar financiamiento.",
        `Nombre: ${d.nombre}`,
        d.vehiculo ? `Vehículo de interés: ${d.vehiculo}` : null,
        d.pie ? `Pie disponible: ${d.pie}` : null,
        d.trabajador ? `Trabajador: ${d.trabajador}` : null,
      ];
      break;
    }
    case "seguro": {
      const d = lead.data;
      lines = [
        "Hola AutoDealer, quiero cotizar un seguro automotriz con BCI Seguros.",
        `Nombre: ${d.nombre}`,
        `Vehículo: ${d.vehiculo}${d.anio ? ` ${d.anio}` : ""}`,
        d.patente ? `Patente: ${d.patente}` : null,
      ];
      break;
    }
    case "vende": {
      const d = lead.data;
      lines = [
        "Hola AutoDealer, quiero vender mi auto.",
        `Nombre: ${d.nombre}`,
        `Vehículo: ${d.vehiculo}${d.anio ? ` ${d.anio}` : ""}`,
        d.kilometraje != null ? `Kilometraje: ${km(d.kilometraje)}` : null,
        d.patente ? `Patente: ${d.patente}` : null,
        d.modalidad ? `Modalidad: ${d.modalidad}` : null,
      ];
      break;
    }
    case "contacto": {
      const d = lead.data;
      lines = ["Hola AutoDealer.", `Nombre: ${d.nombre}`, d.motivo ? `Motivo: ${d.motivo}` : null];
      break;
    }
  }
  const mensaje = lead.data.mensaje;
  if (mensaje) lines.push(lead.form === "contacto" ? mensaje : `Comentario: ${mensaje}`);
  return lines.filter(Boolean).join("\n");
}
