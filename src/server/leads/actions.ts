"use server";

import { headers } from "next/headers";
import { db } from "@/lib/db";
import { leadWhatsappMessage, parseLead } from "@/lib/leads/schema";
import { sha256 } from "@/lib/security/crypto";
import { whatsappUrl } from "@/lib/whatsapp";
import { createLead, isRateLimited } from "./repository";

export type LeadFormState =
  | { status: "idle" }
  | { status: "error"; message: string; fieldErrors: Record<string, string>; values: Record<string, string> }
  | { status: "success"; name: string; whatsappUrl: string };

const ALLOWED_PAGES = new Set(["/financiamiento", "/seguros", "/vende-tu-auto", "/contacto"]);

/**
 * Formularios públicos (financiamiento, seguros, venta y contacto). Sin autenticación (son de contacto):
 * validación en servidor, campo trampa contra bots y límite de envíos por visitante.
 */
export async function submitLead(_prev: LeadFormState, formData: FormData): Promise<LeadFormState> {
  const raw: Record<string, string> = {};
  for (const [k, v] of formData) if (typeof v === "string" && !k.startsWith("$ACTION")) raw[k] = v;
  const values = Object.fromEntries(Object.entries(raw).filter(([k]) => k !== "sitio_web"));

  // Campo trampa: invisible para personas. Si viene lleno, se responde "éxito" sin guardar.
  if (raw.sitio_web) return { status: "success", name: "", whatsappUrl: whatsappUrl() };

  const parsed = parseLead(raw.tipo ?? "", raw);
  if (!parsed.ok) {
    return { status: "error", message: "Revisa los campos marcados.", fieldErrors: parsed.fieldErrors, values };
  }

  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || null;
  const ipHash = ip ? sha256(`lead:${ip}`) : null;

  try {
    if (await isRateLimited(db, ipHash)) {
      return {
        status: "error",
        message: "Recibimos varias solicitudes desde tu conexión. Escríbenos por WhatsApp y te atendemos de inmediato.",
        fieldErrors: {},
        values,
      };
    }
    await createLead(db, parsed.lead, { page: ALLOWED_PAGES.has(raw.pagina) ? raw.pagina : null, ipHash });
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

  return {
    status: "success",
    name: parsed.lead.data.nombre.split(" ")[0],
    whatsappUrl: whatsappUrl(leadWhatsappMessage(parsed.lead)),
  };
}
