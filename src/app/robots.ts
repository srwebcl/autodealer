import type { MetadataRoute } from "next";
import { siteConfig } from "@/config/site";
import { absoluteUrl } from "@/lib/seo/urls";

export default function robots(): MetadataRoute.Robots {
  // Hasta el lanzamiento en el dominio final (NEXT_PUBLIC_SITE_INDEXABLE=true) no se indexa nada.
  if (!siteConfig.indexable) return { rules: { userAgent: "*", disallow: "/" } };
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/admin", "/api/"] },
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}
