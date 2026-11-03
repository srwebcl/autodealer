import { CONSIGNMENT_POINTS } from "@/config/consignment";
import { googleReviews } from "@/config/google-reviews";
import { siteConfig } from "@/config/site";
import { absoluteUrl } from "@/lib/seo/urls";
import { formatClp, formatKm } from "@/lib/utils/format";
import { getSearchIndex } from "@/server/vehicles/queries";

/**
 * /llms.txt (llmstxt.org): resumen en Markdown para asistentes de IA (ChatGPT, Claude, Gemini,
 * Perplexity…). Solo datos confirmados y el inventario publicado; se actualiza con la caché
 * del inventario (etiqueta "vehicles", que la sincronización invalida).
 */
export async function GET() {
  const vehicles = (await getSearchIndex()).filter((v) => v.status === "AVAILABLE" || v.status === "RESERVED");
  const hours = siteConfig.hours.map((h) => `${h.days}: ${h.time.replace(/\.$/, "")}`).join(" · ");

  const inventory = vehicles.length
    ? vehicles
        .map((v) => {
          const name = [v.make, v.model, v.version, v.year].filter(Boolean).join(" ");
          const facts = [formatKm(v.mileageKm), v.transmission, v.fuelType, formatClp(v.priceClp) ?? "precio a consultar", v.status === "RESERVED" ? "reservado" : null]
            .filter(Boolean)
            .join(", ");
          return `- [${name}](${absoluteUrl(`/vehiculos/${v.slug}`)}): ${facts}`;
        })
        .join("\n")
    : "- No hay vehículos publicados en este momento.";

  const body = `# ${siteConfig.name} — Automotora en ${siteConfig.city}

> ${siteConfig.name} es una automotora en ${siteConfig.city}, región de ${siteConfig.region}, ${siteConfig.country}. Vende autos usados, recibe vehículos en consignación y en parte de pago, y gestiona financiamiento automotriz y seguros. Atiende en ${siteConfig.addressWithReference}.

## Datos de contacto

- Dirección: ${siteConfig.addressWithReference}
- Horario: ${hours}. Domingo cerrado.
- Teléfono y WhatsApp: ${siteConfig.phoneDisplay}
- Email: ${siteConfig.email}
- Instagram: ${siteConfig.instagramUrl}
- Google Maps: ${googleReviews.profileUrl}${googleReviews.rating ? ` (${googleReviews.rating.toLocaleString("es-CL", { minimumFractionDigits: 1 })} estrellas en Google)` : ""}

## Páginas

- [Vehículos disponibles](${absoluteUrl("/vehiculos")}): catálogo con fotos, precio, kilometraje y datos de cada auto.
- [Vende tu auto](${absoluteUrl("/vende-tu-auto")}): consignación (AutoDealer vende el auto por el dueño) o parte de pago por un auto del catálogo.
- [Financiamiento](${absoluteUrl("/financiamiento")}): crédito automotriz con Autofin, Global, Unidad Crédito y otras financieras.
- [Seguros](${absoluteUrl("/seguros")}): seguro automotriz con BCI Seguros, convenio directo.
- [Contacto](${absoluteUrl("/contacto")}): dirección, horario, teléfono, WhatsApp y formulario.

## Consignación: ${CONSIGNMENT_POINTS.length} puntos clave

${CONSIGNMENT_POINTS.map((p, i) => `${i + 1}. ${p.title}: ${p.items.join(" ")}`).join("\n")}

## Vehículos disponibles ahora

${inventory}

Los precios y la disponibilidad se confirman por WhatsApp o teléfono. El catálogo se actualiza automáticamente con las publicaciones de Instagram de ${siteConfig.instagramHandle}.
`;

  return new Response(body, { headers: { "Content-Type": "text/markdown; charset=utf-8" } });
}
