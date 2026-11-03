import { siteConfig } from "@/config/site";
import { absoluteUrl } from "@/lib/seo/urls";
import { whatsappUrl } from "@/lib/whatsapp";
import { formatChileanPhone, leadWhatsappMessage, type ParsedLead } from "./schema";

/**
 * Correos de los formularios: aviso interno con la solicitud completa y confirmación al cliente.
 * HTML simple con tablas y estilos en línea (compatible con Gmail, Outlook y Apple Mail),
 * siempre con versión de texto plano: ayuda a que no se marquen como spam.
 */

export type LeadEmail = { subject: string; html: string; text: string };
export type LeadMeta = { id: string; createdAt: Date; page?: string | null };

/** Nombre de cada formulario dentro de una frase ("tu solicitud de …"). */
const FORM_NAMES: Record<ParsedLead["form"], { team: string; customer: string }> = {
  financiamiento: { team: "Financiamiento", customer: "tu solicitud de financiamiento" },
  seguro: { team: "Seguro automotriz", customer: "tu solicitud de cotización de seguro" },
  vende: { team: "Vende tu auto", customer: "los datos de tu auto" },
  contacto: { team: "Contacto", customer: "tu mensaje" },
};

const FIELD_LABELS: Record<string, string> = {
  modalidad: "Le interesa",
  motivo: "Motivo",
  vehiculo: "Vehículo",
  anio: "Año",
  kilometraje: "Kilometraje",
  patente: "Patente",
  pie: "Pie disponible",
  trabajador: "Situación laboral",
  mensaje: "Mensaje",
};

const COLORS = { ink: "#08090b", red: "#c8202c", yellow: "#fff000", text: "#1d1f24", muted: "#5f6570", line: "#e6e7ea", bg: "#f2f3f5" };
const FONT = "Arial, Helvetica, sans-serif";

export function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

/** Datos de la solicitud (sin nombre, teléfono ni email), en el orden del formulario. */
export function leadDetails(lead: ParsedLead): { label: string; value: string }[] {
  const d = lead.data as Record<string, unknown>;
  const rows: { label: string; value: string }[] = [];
  for (const key of Object.keys(FIELD_LABELS)) {
    const v = d[key];
    if (v == null || v === "") continue;
    let value = String(v);
    if (key === "kilometraje" && typeof v === "number") value = `${v.toLocaleString("es-CL")} km`;
    const label = key === "vehiculo" && lead.form === "financiamiento" ? "Vehículo de interés" : FIELD_LABELS[key];
    rows.push({ label, value });
  }
  return rows;
}

const firstName = (nombre: string) => nombre.trim().split(/\s+/)[0] ?? nombre;

function formatDate(date: Date): string {
  return date.toLocaleString("es-CL", { timeZone: siteConfig.timeZone, dateStyle: "long", timeStyle: "short" });
}

// ─── Piezas HTML ──────────────────────────────────────────────────────────

function layout({ preheader, body, footer }: { preheader: string; body: string; footer: string }): string {
  const logo = absoluteUrl("/brand/logo-autodealer-trim.png");
  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light">
<meta name="supported-color-schemes" content="light">
<title>${escapeHtml(siteConfig.name)}</title>
</head>
<body style="margin:0;padding:0;background:${COLORS.bg};">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${COLORS.bg};">
<tr><td align="center" style="padding:24px 12px;">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px;background:#ffffff;border-radius:6px;overflow:hidden;">
<tr><td bgcolor="${COLORS.ink}" style="background:${COLORS.ink};padding:22px 32px;">
<img src="${logo}" width="190" height="24" alt="AutoDealer" style="display:block;border:0;width:190px;height:auto;color:#ffffff;font:bold 20px ${FONT};">
</td></tr>
<tr><td style="height:4px;line-height:4px;font-size:0;background:${COLORS.yellow};">&nbsp;</td></tr>
<tr><td style="padding:32px 32px 8px;font-family:${FONT};color:${COLORS.text};font-size:15px;line-height:1.6;">
${body}
</td></tr>
<tr><td style="padding:24px 32px 28px;border-top:1px solid ${COLORS.line};font-family:${FONT};color:${COLORS.muted};font-size:12px;line-height:1.6;">
${footer}
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;
}

function heading(eyebrow: string, title: string): string {
  return `<p style="margin:0 0 6px;font-size:12px;font-weight:bold;letter-spacing:1.5px;text-transform:uppercase;color:${COLORS.red};">${escapeHtml(eyebrow)}</p>
<h1 style="margin:0 0 16px;font-size:24px;line-height:1.25;color:${COLORS.ink};">${escapeHtml(title)}</h1>`;
}

function rowsTable(rows: { label: string; value: string; href?: string }[]): string {
  const tr = rows
    .map(({ label, value, href }) => {
      const content = escapeHtml(value).replace(/\n/g, "<br>");
      const v = href ? `<a href="${escapeHtml(href)}" style="color:${COLORS.ink};font-weight:bold;">${content}</a>` : content;
      return `<tr>
<td valign="top" style="padding:10px 12px 10px 0;border-bottom:1px solid ${COLORS.line};width:38%;font-size:13px;color:${COLORS.muted};">${escapeHtml(label)}</td>
<td valign="top" style="padding:10px 0;border-bottom:1px solid ${COLORS.line};font-size:15px;color:${COLORS.text};">${v}</td>
</tr>`;
    })
    .join("\n");
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 24px;border-top:1px solid ${COLORS.line};font-family:${FONT};">${tr}</table>`;
}

function button(href: string, label: string, color: string = COLORS.red): string {
  return `<a href="${escapeHtml(href)}" style="display:inline-block;margin:0 8px 10px 0;padding:12px 20px;background:${color};color:#ffffff;font-family:${FONT};font-size:14px;font-weight:bold;text-decoration:none;border-radius:4px;">${escapeHtml(label)}</a>`;
}

function sectionTitle(title: string): string {
  return `<h2 style="margin:8px 0 8px;font-size:13px;letter-spacing:1px;text-transform:uppercase;color:${COLORS.muted};">${escapeHtml(title)}</h2>`;
}

function contactFooter(note: string): { html: string; text: string } {
  const hours = siteConfig.hours.map((h) => `${h.days}: ${h.time}`).join(" · ");
  const html = `<p style="margin:0 0 6px;font-weight:bold;color:${COLORS.text};">${escapeHtml(siteConfig.name)} · ${escapeHtml(siteConfig.city)}</p>
<p style="margin:0 0 6px;">${escapeHtml(siteConfig.addressWithReference)}</p>
<p style="margin:0 0 6px;">${escapeHtml(hours)}</p>
<p style="margin:0 0 14px;"><a href="tel:${siteConfig.phoneE164}" style="color:${COLORS.muted};">${escapeHtml(siteConfig.phoneDisplay)}</a> · <a href="mailto:${siteConfig.email}" style="color:${COLORS.muted};">${escapeHtml(siteConfig.email)}</a> · <a href="${siteConfig.url}" style="color:${COLORS.muted};">${escapeHtml(new URL(siteConfig.url).host)}</a></p>
<p style="margin:0;">${escapeHtml(note)}</p>`;
  const text = [`${siteConfig.name} · ${siteConfig.city}`, siteConfig.addressWithReference, hours, `${siteConfig.phoneDisplay} · ${siteConfig.email} · ${siteConfig.url}`, "", note].join("\n");
  return { html, text };
}

const textRows = (rows: { label: string; value: string }[]) => rows.map((r) => `${r.label}: ${r.value}`).join("\n");

// ─── Correos ──────────────────────────────────────────────────────────────

/** Aviso interno: la solicitud completa, con accesos directos para responder. */
export function teamLeadEmail(lead: ParsedLead, meta: LeadMeta): LeadEmail {
  const { nombre, telefono, email } = lead.data;
  const formName = FORM_NAMES[lead.form].team;
  const phone = formatChileanPhone(telefono);
  const waToClient = `https://wa.me/${telefono.replace(/\D/g, "")}?text=${encodeURIComponent(`Hola ${firstName(nombre)}, te escribimos de AutoDealer por tu solicitud en nuestra web.`)}`;
  const contact = [
    { label: "Nombre", value: nombre },
    { label: "Teléfono", value: phone, href: `tel:${telefono}` },
    { label: "Email", value: email, href: `mailto:${email}` },
  ];
  const details = leadDetails(lead);
  const origin = [
    { label: "Recibida", value: formatDate(meta.createdAt) },
    ...(meta.page ? [{ label: "Página", value: absoluteUrl(meta.page) }] : []),
    { label: "ID", value: meta.id },
  ];

  const body = `${heading(`Nueva solicitud · ${formName}`, nombre)}
<p style="margin:0 0 20px;">Llegó una solicitud desde el formulario <strong>${escapeHtml(formName)}</strong> de la web. Responde este correo para escribirle directamente al cliente.</p>
<div style="margin:0 0 18px;">${button(`tel:${telefono}`, "Llamar", COLORS.ink)}${button(waToClient, "WhatsApp", "#1e8e4e")}${button(`mailto:${email}`, "Email", COLORS.red)}</div>
${sectionTitle("Cliente")}
${rowsTable(contact)}
${details.length ? `${sectionTitle("Solicitud")}\n${rowsTable(details)}` : ""}
${sectionTitle("Origen")}
${rowsTable(origin)}`;

  const footer = `<p style="margin:0;">Aviso automático de ${escapeHtml(new URL(siteConfig.url).host)}. La solicitud también queda guardada en la base de datos del sitio.</p>`;
  const text = [
    `Nueva solicitud · ${formName}`,
    "",
    "CLIENTE",
    textRows(contact),
    ...(details.length ? ["", "SOLICITUD", textRows(details)] : []),
    "",
    "ORIGEN",
    textRows(origin),
    "",
    `WhatsApp del cliente: ${waToClient}`,
  ].join("\n");

  return {
    subject: `Nueva solicitud: ${formName} · ${nombre}`,
    html: layout({ preheader: `${nombre} · ${phone} · ${email}`, body, footer }),
    text,
  };
}

/** Confirmación al cliente: recibimos su solicitud y lo contactaremos pronto. */
export function customerLeadEmail(lead: ParsedLead): LeadEmail {
  const name = firstName(lead.data.nombre);
  const what = FORM_NAMES[lead.form].customer;
  const details = leadDetails(lead);
  const wa = whatsappUrl(leadWhatsappMessage(lead));
  const hours = siteConfig.hours.map((h) => `${h.days.toLowerCase()} de ${h.time.replace(/\.$/, "")}`).join(" y ");
  const intro = `Recibimos ${what}. Un asesor de ${siteConfig.name} te contactará pronto por teléfono, WhatsApp o email.`;
  const extra =
    lead.form === "vende"
      ? "Para avanzar más rápido con la evaluación, puedes enviarnos algunas fotos de tu auto por WhatsApp."
      : "Si quieres adelantar la conversación, escríbenos por WhatsApp.";

  const body = `${heading("Solicitud recibida", `¡Gracias, ${name}!`)}
<p style="margin:0 0 12px;">${escapeHtml(intro)}</p>
<p style="margin:0 0 20px;">Atendemos ${escapeHtml(hours)}. ${escapeHtml(extra)}</p>
<div style="margin:0 0 18px;">${button(wa, "Escribir por WhatsApp", "#1e8e4e")}</div>
${details.length ? `${sectionTitle("Lo que nos enviaste")}\n${rowsTable(details)}` : ""}
<p style="margin:0 0 20px;">Si necesitas corregir algún dato, responde este correo.</p>`;

  const note = `Recibiste este correo porque completaste un formulario en ${new URL(siteConfig.url).host}.`;
  const f = contactFooter(note);
  const text = [
    `¡Gracias, ${name}!`,
    "",
    intro,
    `Atendemos ${hours}. ${extra}`,
    `WhatsApp: ${siteConfig.phoneDisplay} (https://wa.me/${siteConfig.whatsappNumber})`,
    ...(details.length ? ["", "LO QUE NOS ENVIASTE", textRows(details)] : []),
    "",
    "Si necesitas corregir algún dato, responde este correo.",
    "",
    "—",
    f.text,
  ].join("\n");

  return {
    subject: `Recibimos ${what} · ${siteConfig.name}`,
    html: layout({ preheader: intro, body, footer: f.html }),
    text,
  };
}
