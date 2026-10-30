import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  poweredByHeader: false,
  images: {
    // Obligatorio desde Next 16: limita las calidades que el optimizador acepta.
    qualities: [70, 80],
    formats: ["image/avif", "image/webp"],
    // Los dominios de R2 se añadirán en remotePatterns en la Fase 5.
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
