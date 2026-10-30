import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/seo/urls";
import { getIndexableSlugs } from "@/server/vehicles/queries";

// Solo páginas indexables: financiamiento y vende-tu-auto se añaden cuando sus textos estén aprobados.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const vehicles = await getIndexableSlugs();
  return [
    { url: absoluteUrl("/"), changeFrequency: "daily", priority: 1 },
    { url: absoluteUrl("/vehiculos"), changeFrequency: "daily", priority: 0.9 },
    { url: absoluteUrl("/contacto"), changeFrequency: "monthly", priority: 0.5 },
    ...vehicles.map((v) => ({
      url: absoluteUrl(`/vehiculos/${v.slug}`),
      lastModified: v.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
  ];
}
