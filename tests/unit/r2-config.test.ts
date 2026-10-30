import { describe, expect, it } from "vitest";
import { getR2Env, isR2DevUrl } from "@/lib/storage/r2";

const base = {
  R2_ACCOUNT_ID: "a".repeat(32),
  R2_ACCESS_KEY_ID: "k".repeat(32),
  R2_SECRET_ACCESS_KEY: "s".repeat(64),
  R2_BUCKET_NAME: "autodealer-media",
  R2_PUBLIC_BASE_URL: "https://pub-123.r2.dev",
};

describe("getR2Env", () => {
  it("acepta r2.dev fuera de producción", () => {
    expect(getR2Env({ ...base, VERCEL_ENV: "preview" }).R2_BUCKET_NAME).toBe("autodealer-media");
  });
  it("rechaza r2.dev en producción", () => {
    expect(() => getR2Env({ ...base, VERCEL_ENV: "production" })).toThrow(/dominio personalizado/);
  });
  it("acepta dominio propio en producción", () => {
    expect(getR2Env({ ...base, VERCEL_ENV: "production", R2_PUBLIC_BASE_URL: "https://img.autodealer.cl" })).toBeTruthy();
  });
  it("errores sin valores secretos", () => {
    try {
      getR2Env({ ...base, R2_ACCOUNT_ID: "SECRETO-MAL-FORMADO" });
    } catch (e) {
      expect(String(e)).toMatch(/R2_ACCOUNT_ID/);
      expect(String(e)).not.toContain("SECRETO");
    }
  });
  it("isR2DevUrl", () => {
    expect(isR2DevUrl("https://pub-x.r2.dev/a")).toBe(true);
    expect(isR2DevUrl("https://img.autodealer.cl")).toBe(false);
  });
});
