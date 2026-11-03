import "server-only";
import { emailConfig } from "@/config/email";
import { customerLeadEmail, type LeadMeta, teamLeadEmail } from "@/lib/leads/emails";
import type { ParsedLead } from "@/lib/leads/schema";
import { sendEmail } from "@/server/email/resend";

/**
 * Avisa de una solicitud nueva: correo interno con todos los datos y confirmación al cliente.
 * Se ejecuta después de responder al visitante; si falla, la solicitud ya quedó guardada.
 */
export async function notifyLead(lead: ParsedLead, meta: LeadMeta): Promise<void> {
  const team = teamLeadEmail(lead, meta);
  const customer = customerLeadEmail(lead);
  const tags = { tipo: lead.form };

  const [teamResult, customerResult] = await Promise.all([
    sendEmail({
      from: emailConfig.from,
      to: emailConfig.leadsTo,
      replyTo: lead.data.email,
      ...team,
      idempotencyKey: `lead-${meta.id}-equipo`,
      tags: { ...tags, destino: "equipo" },
    }),
    sendEmail({
      from: emailConfig.from,
      to: [lead.data.email],
      replyTo: emailConfig.customerReplyTo,
      ...customer,
      idempotencyKey: `lead-${meta.id}-cliente`,
      tags: { ...tags, destino: "cliente" },
    }),
  ]);

  // Solo el ID de la solicitud: sin datos personales en los logs.
  for (const [who, r] of [["equipo", teamResult], ["cliente", customerResult]] as const) {
    if (r.ok) console.info(`[leads] correo ${who} enviado`, meta.id);
    else console.error(`[leads] correo ${who} falló`, meta.id, r.error);
  }
}
