import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  poweredByHeader: false,
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
