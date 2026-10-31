import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/seo/urls";
import { getIndexableSlugs } from "@/server/vehicles/queries";

// Solo páginas indexables: vende-tu-auto se añade cuando su texto esté aprobado.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const vehicles = await getIndexableSlugs();
  return [
    { url: absoluteUrl("/"), changeFrequency: "daily", priority: 1 },
    { url: absoluteUrl("/vehiculos"), changeFrequency: "daily", priority: 0.9 },
    { url: absoluteUrl("/financiamiento"), changeFrequency: "monthly", priority: 0.7 },
    { url: absoluteUrl("/seguros"), changeFrequency: "monthly", priority: 0.6 },
    { url: absoluteUrl("/contacto"), changeFrequency: "monthly", priority: 0.5 },
    ...vehicles.map((v) => ({
      url: absoluteUrl(`/vehiculos/${v.slug}`),
      lastModified: v.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
  ];
}
