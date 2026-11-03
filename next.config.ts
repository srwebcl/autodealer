import type { NextConfig } from "next";

/**
 * Dominio canónico: el de NEXT_PUBLIC_SITE_URL. Cuando es el dominio final (www.autodealer.cl),
 * la dirección vercel.app de producción y el dominio sin "www" redirigen a él de forma permanente.
 * /api queda fuera: los cron de Vercel y las rutas internas siguen respondiendo en cualquier host.
 */
const CANONICAL = new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000");
const FINAL_HOST = "www.autodealer.cl";
const ALIAS_HOSTS = ["autodealer.cl", "autodealer-eight.vercel.app"];

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  poweredByHeader: false,
  async redirects() {
    if (CANONICAL.hostname !== FINAL_HOST) return [];
    return ALIAS_HOSTS.flatMap((host) => [
      { source: "/", has: [{ type: "host" as const, value: host }], destination: `${CANONICAL.origin}/`, permanent: true },
      {
        source: "/:path((?!api(?:/|$)).+)",
        has: [{ type: "host" as const, value: host }],
        destination: `${CANONICAL.origin}/:path`,
        permanent: true,
      },
    ]);
  },
  images: {
    // Obligatorio desde Next 16: limita las calidades que el optimizador acepta.
    qualities: [70, 80],
    formats: ["image/avif", "image/webp"],
    // Fotos de vehículos: ruta propia /media/... (lee R2 de forma privada). Sin dominios remotos.
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
