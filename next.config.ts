import type { NextConfig } from "next";

// Dominio público de R2 (Fase 5). Si no está definido, no se permiten imágenes remotas.
const r2Base = process.env.R2_PUBLIC_BASE_URL ? new URL(process.env.R2_PUBLIC_BASE_URL) : null;

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  poweredByHeader: false,
  images: {
    // Obligatorio desde Next 16: limita las calidades que el optimizador acepta.
    qualities: [70, 80],
    formats: ["image/avif", "image/webp"],
    remotePatterns: r2Base
      ? [
          {
            protocol: r2Base.protocol.replace(":", "") as "https" | "http",
            hostname: r2Base.hostname,
            pathname: `${r2Base.pathname.replace(/\/$/, "")}/**`,
          },
        ]
      : [],
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
