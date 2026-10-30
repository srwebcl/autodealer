import { afterEach, describe, expect, it, vi } from "vitest";
import { getR2Env, R2Storage } from "@/lib/storage/r2";

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

describe("R2Storage.put", () => {
  afterEach(() => vi.unstubAllGlobals());

  // En rutas de Next.js, fetch con un Request lo reconstruye con body como stream
  // (sin Content-Length) y R2 responde 411. Debe enviarse URL + init con el Uint8Array.
  it("envía el cuerpo binario en init (no un Request) y firmado", async () => {
    const calls: [RequestInfo | URL, RequestInit | undefined][] = [];
    vi.stubGlobal("fetch", async (input: RequestInfo | URL, init?: RequestInit) => {
      calls.push([input, init]);
      return new Response(null, { status: 200 });
    });
    const body = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 1]);
    await new R2Storage(getR2Env(base)).put("instagram/1/2.jpg", body, "image/jpeg");

    expect(calls).toHaveLength(1);
    const [input, init] = calls[0];
    expect(input).not.toBeInstanceOf(Request);
    expect(String(input)).toContain("/autodealer-media/instagram/1/2.jpg");
    expect(init?.method).toBe("PUT");
    expect(init?.body).toBe(body);
    const headers = new Headers(init?.headers);
    expect(headers.get("authorization")).toMatch(/^AWS4-HMAC-SHA256 /);
    expect(headers.get("content-type")).toBe("image/jpeg");
  });
});
