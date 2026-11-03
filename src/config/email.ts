import { siteConfig } from "./site";

/**
 * Envío de correos (Resend). Los destinatarios no son secretos: se pueden cambiar por variable
 * de entorno sin tocar el código. El remitente debe pertenecer a un dominio verificado en Resend.
 */
const list = (v: string | undefined, fallback: string[]) => {
  const items = (v ?? "").split(",").map((s) => s.trim()).filter(Boolean);
  return items.length ? items : fallback;
};

export const emailConfig = {
  from: process.env.EMAIL_FROM?.trim() || "AutoDealer <notificaciones@autodealer.cl>",
  /** Quién recibe el aviso de cada solicitud de los formularios. */
  leadsTo: list(process.env.LEADS_NOTIFY_TO, ["cplacencia@autodealer.cl"]),
  /** A dónde llegan las respuestas del cliente al correo de confirmación. */
  customerReplyTo: process.env.EMAIL_REPLY_TO?.trim() || siteConfig.email,
};
