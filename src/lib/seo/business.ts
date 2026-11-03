import { googleReviews } from "@/config/google-reviews";
import { siteConfig } from "@/config/site";
import { absoluteUrl } from "@/lib/seo/urls";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

/**
 * schema.org/AutoDealer: quién es la automotora, dónde está, cuándo atiende y cómo contactarla.
 * Lo leen Google (panel del negocio, resultados locales) y los asistentes de IA. Solo datos
 * confirmados por el cliente; sin coordenadas ni valoraciones (Google no acepta reseñas propias).
 */
export function businessJsonLd(): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "AutoDealer",
    "@id": absoluteUrl("/#automotora"),
    name: siteConfig.name,
    description: siteConfig.description,
    url: absoluteUrl("/"),
    logo: absoluteUrl("/brand/logo-autodealer.png"),
    image: absoluteUrl("/opengraph-image.jpg"),
    telephone: siteConfig.phoneE164,
    email: siteConfig.email,
    address: {
      "@type": "PostalAddress",
      streetAddress: siteConfig.streetAddress,
      addressLocality: siteConfig.city,
      addressRegion: siteConfig.region,
      addressCountry: "CL",
    },
    hasMap: googleReviews.profileUrl,
    areaServed: { "@type": "City", name: siteConfig.city },
    openingHoursSpecification: siteConfig.schedule.map((s) => ({
      "@type": "OpeningHoursSpecification",
      dayOfWeek: s.days.map((d) => DAYS[d]),
      opens: s.open,
      closes: s.close,
    })),
    sameAs: [siteConfig.instagramUrl],
    makesOffer: [
      { "@type": "Offer", itemOffered: { "@type": "Service", name: "Venta de autos usados" } },
      { "@type": "Offer", itemOffered: { "@type": "Service", name: "Consignación de vehículos" }, url: absoluteUrl("/vende-tu-auto") },
      { "@type": "Offer", itemOffered: { "@type": "Service", name: "Financiamiento automotriz" }, url: absoluteUrl("/financiamiento") },
      { "@type": "Offer", itemOffered: { "@type": "Service", name: "Seguro automotriz" }, url: absoluteUrl("/seguros") },
    ],
  };
}

/** schema.org/WebSite: nombre del sitio en Google y su buscador (el catálogo acepta ?q=). */
export function websiteJsonLd(): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": absoluteUrl("/#sitio"),
    name: siteConfig.name,
    alternateName: `${siteConfig.name} ${siteConfig.city}`,
    url: absoluteUrl("/"),
    inLanguage: "es-CL",
    publisher: { "@id": absoluteUrl("/#automotora") },
    potentialAction: {
      "@type": "SearchAction",
      target: { "@type": "EntryPoint", urlTemplate: `${absoluteUrl("/vehiculos")}?q={search_term_string}` },
      "query-input": "required name=search_term_string",
    },
  };
}

/** schema.org/BreadcrumbList: la ruta que Google muestra en el resultado (Inicio › Vehículos › …). */
export function breadcrumbJsonLd(items: { name: string; path: string }[]): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({ "@type": "ListItem", position: i + 1, name: item.name, item: absoluteUrl(item.path) })),
  };
}
