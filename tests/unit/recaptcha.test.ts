import { describe, expect, it } from "vitest";
import { recaptchaAction, verifyRecaptcha } from "@/lib/security/recaptcha";

const google = (body: object) => (async () => new Response(JSON.stringify(body))) as unknown as typeof fetch;
const opts = (body: object) => ({ secret: "test", fetchImpl: google(body) });

describe("reCAPTCHA v3", () => {
  it("sin clave secreta no verifica (desactivado)", async () => {
    expect(await verifyRecaptcha(undefined, "lead_vende", { secret: "" })).toEqual({ ok: true, skipped: true });
  });

  it("exige token cuando está activo", async () => {
    expect(await verifyRecaptcha(undefined, "lead_vende", opts({}))).toEqual({ ok: false, reason: "missing-token" });
  });

  it("acepta puntaje alto con la acción correcta", async () => {
    expect(await verifyRecaptcha("t", "lead_vende", opts({ success: true, score: 0.9, action: "lead_vende" }))).toEqual({ ok: true, skipped: false, score: 0.9 });
  });

  it.each([
    [{ success: false }, "invalid"],
    [{ success: true, score: 0.9, action: "lead_contacto" }, "action-mismatch"],
    [{ success: true, score: 0.2, action: "lead_vende" }, "low-score"],
  ] as const)("rechaza %j", async (body, reason) => {
    expect(await verifyRecaptcha("t", "lead_vende", opts(body))).toMatchObject({ ok: false, reason });
  });

  it("si Google no responde, deja pasar (quedan campo trampa y límite por IP)", async () => {
    const fail = (async () => { throw new Error("timeout"); }) as unknown as typeof fetch;
    expect(await verifyRecaptcha("t", "lead_vende", { secret: "x", fetchImpl: fail })).toEqual({ ok: true, skipped: true });
  });

  it("acción por formulario", () => expect(recaptchaAction("vende")).toBe("lead_vende"));
});
