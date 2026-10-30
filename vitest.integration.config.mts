import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

// Pruebas contra la base configurada en .env.local. Cada prueba revierte sus cambios.
export default defineConfig({
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  test: {
    include: ["tests/integration/**/*.test.ts"],
    environment: "node",
    testTimeout: 30_000,
    fileParallelism: false,
  },
});
