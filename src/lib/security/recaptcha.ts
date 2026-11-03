/**
 * Google reCAPTCHA v3. Se activa solo si están las dos claves:
 * NEXT_PUBLIC_RECAPTCHA_SITE_KEY (navegador) y RECAPTCHA_SECRET_KEY (servidor).
 */
export const RECAPTCHA_SITE_KEY = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY?.trim() || "";

/** Puntaje mínimo (0 = bot, 1 = persona). Google recomienda 0,5 para empezar. */
const DEFAULT_MIN_SCORE = 0.5;

export type RecaptchaCheck =
  | { ok: true; skipped: boolean; score?: number }
  | { ok: false; reason: "missing-token" | "invalid" | "action-mismatch" | "low-score"; score?: number };

type SiteverifyResponse = { success: boolean; score?: number; action?: string; "error-codes"?: string[] };

/** Acción de reCAPTCHA de cada formulario (solo letras y "_"). */
export const recaptchaAction = (form: string) => `lead_${form.replace(/[^a-z_]/gi, "")}`;

export async function verifyRecaptcha(
  token: string | undefined,
  expectedAction: string,
  options: { secret?: string; minScore?: number; remoteIp?: string | null; fetchImpl?: typeof fetch } = {},
): Promise<RecaptchaCheck> {
  const secret = options.secret ?? process.env.RECAPTCHA_SECRET_KEY?.trim();
  if (!secret) return { ok: true, skipped: true };
  if (!token) return { ok: false, reason: "missing-token" };

  const minScore = options.minScore ?? (Number(process.env.RECAPTCHA_MIN_SCORE) || DEFAULT_MIN_SCORE);
  const params = new URLSearchParams({ secret, response: token });
  if (options.remoteIp) params.set("remoteip", options.remoteIp);

  let data: SiteverifyResponse;
  try {
    const res = await (options.fetchImpl ?? fetch)("https://www.google.com/recaptcha/api/siteverify", {
      method: "POST",
      body: params,
      signal: AbortSignal.timeout(5_000),
    });
    data = (await res.json()) as SiteverifyResponse;
  } catch (error) {
    // Si Google no responde no se pierden solicitudes reales: quedan el campo trampa y el límite por IP.
    console.warn("[recaptcha] sin respuesta de Google:", error instanceof Error ? error.message : error);
    return { ok: true, skipped: true };
  }

  if (!data.success) return { ok: false, reason: "invalid" };
  if (data.action !== expectedAction) return { ok: false, reason: "action-mismatch", score: data.score };
  if ((data.score ?? 0) < minScore) return { ok: false, reason: "low-score", score: data.score };
  return { ok: true, skipped: false, score: data.score };
}
