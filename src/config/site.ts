/**
 * Datos comerciales del sitio.
 *
 * - `confirmed`: tomados del sitio estático anterior y aprobados por el cliente.
 * - `draft`: textos PROVISIONALES redactados para maquetar. Deben revisarse antes
 *   del lanzamiento. En la Fase 4 pasarán a la configuración editable del panel.
 */
export const siteConfig = {
  name: "AutoDealer",
  legalName: "AutoDealer",
  city: "La Serena",
  region: "Coquimbo",
  country: "Chile",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  description:
    "Automotora en La Serena. Revisa nuestros vehículos disponibles y cotiza directo por WhatsApp.",

  // confirmed
  address: "Avenida Balmaceda 1595, esquina Huanhualí, La Serena",
  phoneDisplay: "+56 9 6754 6248",
  phoneE164: "+56967546248",
  whatsappNumber: "56967546248",
  email: "contacto@autodealer.cl",
  instagramHandle: "@autodealer.cl",
  instagramUrl: "https://www.instagram.com/autodealer.cl/",

  // draft: horario provisional, pendiente de confirmar
  hours: [
    { days: "Lunes a viernes", time: "10:00 – 19:00" },
    { days: "Sábado", time: "10:00 – 14:00" },
  ],
} as const;

export const mainNav = [
  { href: "/vehiculos", label: "Vehículos" },
  { href: "/financiamiento", label: "Financiamiento" },
  { href: "/vende-tu-auto", label: "Vende tu auto" },
  { href: "/contacto", label: "Contacto" },
] as const;
