import { describe, expect, it } from "vitest";
import { getR2Env } from "@/lib/storage/r2";

const base = {
  R2_ACCOUNT_ID: "a".repeat(32),
  R2_ACCESS_KEY_ID: "k".repeat(32),
  R2_SECRET_ACCESS_KEY: "s".repeat(64),
  R2_BUCKET_NAME: "autodealer-media",
};

describe("getR2Env", () => {
  it("acepta la configuración mínima (sin URL pública: las fotos se sirven desde /media)", () => {
    expect(getR2Env({ ...base, VERCEL_ENV: "production" }).R2_BUCKET_NAME).toBe("autodealer-media");
  });
  it("errores sin valores secretos", () => {
    try {
      getR2Env({ ...base, R2_ACCOUNT_ID: "SECRETO-MAL-FORMADO" });
      throw new Error("debió fallar");
    } catch (e) {
      expect(String(e)).toMatch(/R2_ACCOUNT_ID/);
      expect(String(e)).not.toContain("SECRETO");
    }
  });
});
