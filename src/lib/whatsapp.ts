import { siteConfig } from "@/config/site";
import { formatClp, vehicleTitle } from "@/lib/utils/format";

const DEFAULT_MESSAGE = "Hola AutoDealer, quisiera obtener información.";

/** Construye un enlace wa.me con el mensaje codificado. */
export function whatsappUrl(message: string = DEFAULT_MESSAGE, phone: string = siteConfig.whatsappNumber): string {
  const digits = phone.replace(/\D/g, "");
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

/** Mensaje precompletado que identifica el vehículo sin inventar datos ausentes. */
export function vehicleWhatsappMessage(v: {
  make: string;
  model: string;
  version?: string | null;
  year?: number | null;
  priceClp?: number | null;
  url?: string;
}): string {
  const name = [vehicleTitle(v), v.version, v.year].filter(Boolean).join(" ");
  const price = formatClp(v.priceClp);
  const parts = [`Hola AutoDealer, me interesa el ${name}`];
  if (price) parts.push(`publicado en ${price}`);
  let message = parts.join(", ") + ".";
  if (v.url) message += ` ${v.url}`;
  return message;
}
