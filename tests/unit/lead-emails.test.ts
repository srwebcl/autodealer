import { describe, expect, it } from "vitest";
import { customerLeadEmail, escapeHtml, leadDetails, teamLeadEmail } from "@/lib/leads/emails";
import { type ParsedLead, parseLead } from "@/lib/leads/schema";

function lead(form: string, raw: Record<string, string>): ParsedLead {
  const r = parseLead(form, { nombre: "Ana María Pérez", telefono: "+56 9 1234 5678", email: "Ana@Correo.cl", ...raw });
  if (!r.ok) throw new Error(JSON.stringify(r.fieldErrors));
  return r.lead;
}
const meta = { id: "lead-123", createdAt: new Date("2026-11-03T14:30:00Z"), page: "/vende-tu-auto" };

describe("correos de solicitudes", () => {
  const sell = lead("vende", { vehiculo: "Kia Rio 5", anio: "2019", kilometraje: "85.000", patente: "bc-df-12", modalidad: "Dejarlo en consignación", mensaje: "Tiene <b>mantenciones</b> al día" });

  it("lista los datos de la solicitud con etiquetas y formato", () => {
    expect(leadDetails(sell)).toEqual([
      { label: "Le interesa", value: "Dejarlo en consignación" },
      { label: "Vehículo", value: "Kia Rio 5" },
      { label: "Año", value: "2019" },
      { label: "Kilometraje", value: "85.000 km" },
      { label: "Patente", value: "BCDF12" },
      { label: "Mensaje", value: "Tiene <b>mantenciones</b> al día" },
    ]);
  });

  it("aviso interno: solicitud completa, accesos directos y texto plano", () => {
    const e = teamLeadEmail(sell, meta);
    expect(e.subject).toBe("Nueva solicitud: Vende tu auto · Ana María Pérez");
    for (const s of ["Ana María Pérez", "+56 9 1234 5678", "ana@correo.cl", "Kia Rio 5", "85.000 km", "BCDF12", "lead-123", "tel:+56912345678", "https://wa.me/56912345678"]) {
      expect(e.html).toContain(s);
    }
    expect(e.text).toContain("Patente: BCDF12");
    expect(e.text).toContain("Recibida: 3 de noviembre de 2026");
  });

  it("escapa el HTML que escribe el cliente", () => {
    const e = teamLeadEmail(sell, meta);
    expect(e.html).toContain("Tiene &lt;b&gt;mantenciones&lt;/b&gt; al día");
    expect(e.html).not.toContain("<b>mantenciones</b>");
    expect(escapeHtml(`"a" & 'b'`)).toBe("&quot;a&quot; &amp; &#39;b&#39;");
  });

  it("confirmación al cliente: saludo por nombre, resumen y sin datos internos", () => {
    const e = customerLeadEmail(sell);
    expect(e.subject).toBe("Recibimos los datos de tu auto · AutoDealer");
    expect(e.html).toContain("¡Gracias, Ana!");
    expect(e.html).toContain("fotos de tu auto por WhatsApp");
    expect(e.html).toContain("Kia Rio 5");
    expect(e.html).not.toContain("lead-123");
    expect(e.text).toContain("Recibiste este correo porque completaste un formulario");
  });

  it.each([
    ["financiamiento", { vehiculo: "Peugeot Partner", pie: "Sin pie" }, "tu solicitud de financiamiento", "Vehículo de interés"],
    ["seguro", { vehiculo: "Toyota Hilux" }, "tu solicitud de cotización de seguro", "Vehículo"],
    ["contacto", { motivo: "Otro", mensaje: "Hola, una consulta" }, "tu mensaje", "Motivo"],
  ] as const)("%s", (form, raw, what, label) => {
    const l = lead(form, raw);
    expect(customerLeadEmail(l).subject).toBe(`Recibimos ${what} · AutoDealer`);
    expect(teamLeadEmail(l, meta).html).toContain(label);
  });
});
