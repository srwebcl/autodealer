"use server";

import { headers } from "next/headers";
import { after } from "next/server";
import { db } from "@/lib/db";
import { leadWhatsappMessage, parseLead } from "@/lib/leads/schema";
import { sha256 } from "@/lib/security/crypto";
import { recaptchaAction, verifyRecaptcha } from "@/lib/security/recaptcha";
import { whatsappUrl } from "@/lib/whatsapp";
import { notifyLead } from "./notify";
import { createLead, isRateLimited } from "./repository";

export type LeadFormState =
  | { status: "idle" }
  | { status: "error"; message: string; fieldErrors: Record<string, string>; values: Record<string, string> }
  | { status: "success"; name: string; whatsappUrl: string };

const ALLOWED_PAGES = new Set(["/financiamiento", "/seguros", "/vende-tu-auto", "/contacto"]);

/**
 * Formularios públicos (financiamiento, seguros, venta y contacto). Sin autenticación (son de contacto):
 * validación en servidor, campo trampa contra bots, reCAPTCHA v3 (si está configurado) y límite
 * de envíos por visitante. Tras guardar, se avisa por correo al equipo y al cliente.
 */
export async function submitLead(_prev: LeadFormState, formData: FormData): Promise<LeadFormState> {
  const raw: Record<string, string> = {};
  for (const [k, v] of formData) if (typeof v === "string" && !k.startsWith("$ACTION")) raw[k] = v;
  const values = Object.fromEntries(Object.entries(raw).filter(([k]) => k !== "sitio_web" && k !== "recaptcha"));

  // Campo trampa: invisible para personas. Si viene lleno, se responde "éxito" sin guardar.
  if (raw.sitio_web) return { status: "success", name: "", whatsappUrl: whatsappUrl() };

  const parsed = parseLead(raw.tipo ?? "", raw);
  if (!parsed.ok) {
    return { status: "error", message: "Revisa los campos marcados.", fieldErrors: parsed.fieldErrors, values };
  }

  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || null;
  const ipHash = ip ? sha256(`lead:${ip}`) : null;

  const captcha = await verifyRecaptcha(raw.recaptcha, recaptchaAction(parsed.lead.form), { remoteIp: ip });
  if (!captcha.ok) {
    console.warn("[leads] reCAPTCHA rechazó un envío:", captcha.reason, captcha.score ?? "");
    return {
      status: "error",
      message: "No pudimos verificar tu envío. Recarga la página e inténtalo de nuevo, o escríbenos por WhatsApp.",
      fieldErrors: {},
      values,
    };
  }

  let saved: { id: string; createdAt: Date };
  const page = ALLOWED_PAGES.has(raw.pagina) ? raw.pagina : null;
  try {
    if (await isRateLimited(db, ipHash)) {
      return {
        status: "error",
        message: "Recibimos varias solicitudes desde tu conexión. Escríbenos por WhatsApp y te atendemos de inmediato.",
        fieldErrors: {},
        values,
      };
    }
    saved = await createLead(db, parsed.lead, { page, ipHash });
  } catch (error) {
    // Sin datos personales en el log.
    console.error("[leads] no se pudo guardar la solicitud:", error instanceof Error ? error.message : error);
    return {
      status: "error",
      message: "No pudimos enviar tu solicitud. Inténtalo de nuevo o escríbenos por WhatsApp.",
      fieldErrors: {},
      values,
    };
  }

  // Correos después de responder: el visitante no espera el envío.
  const lead = parsed.lead;
  after(() => notifyLead(lead, { id: saved.id, createdAt: saved.createdAt, page }));

  return {
    status: "success",
    name: parsed.lead.data.nombre.split(" ")[0],
    whatsappUrl: whatsappUrl(leadWhatsappMessage(parsed.lead)),
  };
}
