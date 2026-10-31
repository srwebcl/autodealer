import { z } from "zod";

/** Tipo de formulario (valor del campo oculto "tipo") ↔ enum de la base. */
export const LEAD_FORMS = { financiamiento: "FINANCING", seguro: "INSURANCE" } as const;
export type LeadForm = keyof typeof LEAD_FORMS;

export const DOWN_PAYMENT_OPTIONS = ["Sin pie", "Hasta $2.000.000", "$2.000.000 a $5.000.000", "Más de $5.000.000"] as const;
export const WORKER_OPTIONS = ["Dependiente", "Independiente", "Pensionado"] as const;

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
    .string()
    .trim()
    .max(120)
    .optional()
    .transform((v) => (v ? v.toLowerCase() : undefined))
    .pipe(z.email("Email no válido").optional()),
  mensaje: optional(1000),
});

const financing = base.extend({
  vehiculo: optional(120),
  pie: z.enum(DOWN_PAYMENT_OPTIONS).optional().catch(undefined),
  trabajador: z.enum(WORKER_OPTIONS).optional().catch(undefined),
});

const currentYear = new Date().getFullYear();
const insurance = base.extend({
  vehiculo: trimmed(120).min(2, "Indica la marca y el modelo"),
  anio: z
    .string()
    .trim()
    .optional()
    .transform((v, ctx) => {
      if (!v) return undefined;
      const n = Number(v);
      if (!Number.isInteger(n) || n < 1980 || n > currentYear + 1) {
        ctx.addIssue({ code: "custom", message: "Año no válido" });
        return undefined;
      }
      return n;
    }),
  patente: z
    .string()
    .trim()
    .optional()
    .transform((v, ctx) => {
      if (!v) return undefined;
      const plate = normalizePlate(v);
      if (!plate) ctx.addIssue({ code: "custom", message: "Patente no válida (ej. BCDF12 o AB1234)" });
      return plate ?? undefined;
    }),
});

export const leadSchemas = { financiamiento: financing, seguro: insurance } as const;
export type FinancingLead = z.infer<typeof financing>;
export type InsuranceLead = z.infer<typeof insurance>;
export type ParsedLead = { form: "financiamiento"; data: FinancingLead } | { form: "seguro"; data: InsuranceLead };

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

/** Resumen para WhatsApp: el cliente puede enviarlo para una respuesta inmediata. */
export function leadWhatsappMessage(lead: ParsedLead): string {
  const d = lead.data;
  const lines =
    lead.form === "financiamiento"
      ? [
          "Hola AutoDealer, quiero cotizar financiamiento.",
          `Nombre: ${d.nombre}`,
          lead.data.vehiculo ? `Vehículo de interés: ${lead.data.vehiculo}` : null,
          lead.data.pie ? `Pie disponible: ${lead.data.pie}` : null,
          lead.data.trabajador ? `Trabajador: ${lead.data.trabajador}` : null,
        ]
      : [
          "Hola AutoDealer, quiero cotizar un seguro automotriz con BCI Seguros.",
          `Nombre: ${d.nombre}`,
          `Vehículo: ${lead.data.vehiculo}${lead.data.anio ? ` ${lead.data.anio}` : ""}`,
          lead.data.patente ? `Patente: ${lead.data.patente}` : null,
        ];
  if (d.mensaje) lines.push(`Comentario: ${d.mensaje}`);
  return lines.filter(Boolean).join("\n");
}
