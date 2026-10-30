import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/seo/urls";

export default function robots(): MetadataRoute.Robots {
  // Previews de Vercel y entornos no productivos: no indexar.
  const isProductionSite = process.env.VERCEL_ENV === undefined || process.env.VERCEL_ENV === "production";
  if (!isProductionSite) return { rules: { userAgent: "*", disallow: "/" } };

  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/admin", "/api/"] },
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}
