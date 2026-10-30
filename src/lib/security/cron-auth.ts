import { timingSafeEqual } from "node:crypto";

/** Verifica `Authorization: Bearer <CRON_SECRET>` en tiempo constante (Vercel Cron la envía sola). */
export function isAuthorizedCron(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret || secret.length < 16) return false;
  const expected = Buffer.from(`Bearer ${secret}`);
  const received = Buffer.from(request.headers.get("authorization") ?? "");
  return received.length === expected.length && timingSafeEqual(received, expected);
}
