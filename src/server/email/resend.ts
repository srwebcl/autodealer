import "server-only";

export type OutgoingEmail = {
  from: string;
  to: string[];
  subject: string;
  html: string;
  text: string;
  replyTo?: string;
  /** Evita duplicados si el mismo envío se reintenta (válido 24 h en Resend). */
  idempotencyKey?: string;
  tags?: Record<string, string>;
};

export type SendResult = { ok: true; id: string } | { ok: false; error: string };

/** Envía un correo con la API de Resend. Nunca registra la clave ni el contenido. */
export async function sendEmail(email: OutgoingEmail): Promise<SendResult> {
  const key = process.env.RESEND_API_KEY;
  if (!key) return { ok: false, error: "RESEND_API_KEY no está definida" };

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
        ...(email.idempotencyKey ? { "Idempotency-Key": email.idempotencyKey } : {}),
      },
      body: JSON.stringify({
        from: email.from,
        to: email.to,
        subject: email.subject,
        html: email.html,
        text: email.text,
        reply_to: email.replyTo,
        tags: email.tags ? Object.entries(email.tags).map(([name, value]) => ({ name, value })) : undefined,
      }),
      signal: AbortSignal.timeout(10_000),
    });
    const body = (await res.json().catch(() => ({}))) as { id?: string; message?: string; name?: string };
    if (!res.ok || !body.id) return { ok: false, error: `Resend ${res.status}: ${body.name ?? ""} ${body.message ?? ""}`.trim() };
    return { ok: true, id: body.id };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "error desconocido" };
  }
}
