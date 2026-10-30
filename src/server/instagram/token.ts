import type { PrismaClient } from "@/generated/prisma/client";
import { redactToken } from "@/lib/instagram/client";
import { decrypt, encrypt, sha256 } from "@/lib/security/crypto";

/**
 * Token de Instagram Login almacenado cifrado en Neon y renovado con el mecanismo oficial:
 * GET https://graph.instagram.com/refresh_access_token?grant_type=ig_refresh_token
 * (token de larga duración, ≥ 24 h de antigüedad y vigente; el nuevo dura 60 días).
 *
 * Garantías:
 * - El token renovado se valida (GET /me → user_id) ANTES de reemplazar el vigente.
 * - Si algo falla, el token vigente se conserva y se registra una alerta.
 * - Nunca se registra el token: solo fechas, estados y errores redactados.
 */

const DAY = 86_400_000;

export interface TokenManagerOptions {
  db: PrismaClient;
  key: Buffer;
  /** Clave de la fila en IntegrationCredential (las pruebas usan otra). */
  provider?: string;
  userId: string;
  /** Token de .env: semilla inicial o reemplazo manual. */
  envToken?: string;
  refreshAfterDays?: number;
  /** Tras inicializar con un token de edad desconocida, primera renovación a las 24 h. */
  firstRefreshAfterHours?: number;
  /** Alerta si quedan menos días que esto para el vencimiento. */
  warnBeforeDays?: number;
  fetchImpl?: typeof fetch;
  now?: () => Date;
  /** Registro de eventos (SyncLog). Nunca recibe el token. */
  log?: (level: "INFO" | "WARN" | "ERROR", eventType: string, message: string, details?: Record<string, unknown>) => Promise<unknown>;
}

export type RefreshOutcome =
  | { status: "not_due"; nextRefreshAt: Date }
  | { status: "refreshed"; expiresAt: Date }
  | { status: "failed"; error: string };

export class InstagramTokenManager {
  private readonly o: Required<Omit<TokenManagerOptions, "envToken" | "log">> & Pick<TokenManagerOptions, "envToken" | "log">;

  constructor(options: TokenManagerOptions) {
    this.o = {
      provider: "instagram",
      refreshAfterDays: 50,
      firstRefreshAfterHours: 24,
      warnBeforeDays: 7,
      fetchImpl: fetch,
      now: () => new Date(),
      ...options,
    };
  }

  private async log(level: "INFO" | "WARN" | "ERROR", eventType: string, message: string, details?: Record<string, unknown>) {
    if (level === "ERROR") console.error(`[instagram-token] ${message}`);
    await this.o.log?.(level, eventType, message, details);
  }

  private redact(text: string, ...tokens: string[]) {
    return tokens.reduce((acc, t) => redactToken(acc, t), text).slice(0, 300);
  }

  /** Token vigente. Inicializa desde .env si no hay uno guardado o si .env fue reemplazado manualmente. */
  async getToken(): Promise<string> {
    const row = await this.o.db.integrationCredential.findUnique({ where: { provider: this.o.provider } });
    const env = this.o.envToken?.trim();
    if (env && (!row || row.sourceHash !== sha256(env))) {
      // Token nuevo en .env: se valida antes de adoptarlo.
      const valid = await this.validate(env);
      if (!valid.ok) {
        if (row) {
          await this.log("ERROR", "token.env_invalid", `El token de .env no es válido (${valid.error}); se mantiene el guardado`);
          return decrypt(row, this.o.key);
        }
        throw new Error(`Token de Instagram inválido: ${valid.error}`);
      }
      const enc = encrypt(env, this.o.key);
      await this.o.db.integrationCredential.upsert({
        where: { provider: this.o.provider },
        create: { provider: this.o.provider, ...enc, sourceHash: sha256(env), storedAt: this.o.now() },
        update: { ...enc, sourceHash: sha256(env), storedAt: this.o.now(), lastRefreshedAt: null, expiresAt: null, lastRefreshError: null, refreshFailures: 0 },
      });
      await this.log("INFO", "token.stored", "Token de Instagram inicializado desde la configuración y guardado cifrado");
      return env;
    }
    if (!row) throw new Error("No hay token de Instagram configurado (INSTAGRAM_ACCESS_TOKEN)");
    return decrypt(row, this.o.key);
  }

  /** Comprueba que un token funcione y pertenezca a la cuenta configurada. */
  async validate(token: string): Promise<{ ok: true } | { ok: false; error: string }> {
    try {
      const res = await this.o.fetchImpl("https://graph.instagram.com/v26.0/me?fields=user_id,username", {
        headers: { Authorization: `Bearer ${token}` },
        signal: AbortSignal.timeout(15_000),
        cache: "no-store",
      });
      const body = (await res.json().catch(() => ({}))) as { user_id?: string; error?: { code?: number; message?: string } };
      if (!res.ok || body.error) return { ok: false, error: this.redact(`HTTP ${res.status} código ${body.error?.code ?? "?"}`, token) };
      if (body.user_id !== this.o.userId) return { ok: false, error: "el token pertenece a otra cuenta" };
      return { ok: true };
    } catch (e) {
      return { ok: false, error: this.redact(e instanceof Error ? e.message : String(e), token) };
    }
  }

  /** Fecha de la próxima renovación según la política. */
  nextRefreshAt(row: { storedAt: Date; lastRefreshedAt: Date | null }): Date {
    return row.lastRefreshedAt
      ? new Date(row.lastRefreshedAt.getTime() + this.o.refreshAfterDays * DAY)
      : new Date(row.storedAt.getTime() + this.o.firstRefreshAfterHours * 3_600_000);
  }

  /** Renueva si corresponde (o si `force`). Nunca pierde el token vigente. */
  async refreshIfDue({ force = false } = {}): Promise<RefreshOutcome> {
    const current = await this.getToken();
    const row = (await this.o.db.integrationCredential.findUnique({ where: { provider: this.o.provider } }))!;
    const now = this.o.now();

    if (row.expiresAt && row.expiresAt.getTime() - now.getTime() < this.o.warnBeforeDays * DAY) {
      await this.log("ERROR", "token.expiring", `El token de Instagram vence el ${row.expiresAt.toISOString().slice(0, 10)}`);
    }
    const next = this.nextRefreshAt(row);
    if (!force && now < next) return { status: "not_due", nextRefreshAt: next };

    await this.o.db.integrationCredential.update({ where: { provider: this.o.provider }, data: { lastRefreshAttemptAt: now } });

    let fresh: string | undefined;
    try {
      const url = new URL("https://graph.instagram.com/refresh_access_token");
      url.searchParams.set("grant_type", "ig_refresh_token");
      url.searchParams.set("access_token", current);
      const res = await this.o.fetchImpl(url, { signal: AbortSignal.timeout(15_000), cache: "no-store" });
      const body = (await res.json().catch(() => ({}))) as { access_token?: string; expires_in?: number; error?: { code?: number; message?: string } };
      if (!res.ok || body.error || !body.access_token || !body.expires_in) {
        throw new Error(`HTTP ${res.status} código ${body.error?.code ?? "?"}: ${body.error?.message ?? "respuesta sin token"}`);
      }
      fresh = body.access_token;

      const valid = await this.validate(fresh);
      if (!valid.ok) throw new Error(`El token renovado no pasó la validación (${valid.error})`);

      const expiresAt = new Date(now.getTime() + body.expires_in * 1000);
      await this.o.db.integrationCredential.update({
        where: { provider: this.o.provider },
        data: { ...encrypt(fresh, this.o.key), lastRefreshedAt: now, expiresAt, lastRefreshError: null, refreshFailures: 0 },
      });
      await this.log("INFO", "token.refreshed", "Token de Instagram renovado", { expiresAt: expiresAt.toISOString() });
      return { status: "refreshed", expiresAt };
    } catch (e) {
      const error = this.redact(e instanceof Error ? e.message : String(e), current, fresh ?? "");
      await this.o.db.integrationCredential.update({
        where: { provider: this.o.provider },
        data: { lastRefreshError: error, refreshFailures: { increment: 1 } },
      });
      await this.log("ERROR", "token.refresh_failed", `Falló la renovación del token de Instagram; se conserva el vigente. ${error}`);
      return { status: "failed", error };
    }
  }

  /** Estado sin secretos, para scripts y diagnóstico. */
  async status() {
    const row = await this.o.db.integrationCredential.findUnique({ where: { provider: this.o.provider } });
    if (!row) return null;
    return {
      storedAt: row.storedAt,
      lastRefreshedAt: row.lastRefreshedAt,
      expiresAt: row.expiresAt,
      nextRefreshAt: this.nextRefreshAt(row),
      lastRefreshAttemptAt: row.lastRefreshAttemptAt,
      lastRefreshError: row.lastRefreshError,
      refreshFailures: row.refreshFailures,
      envMatchesStored: this.o.envToken ? row.sourceHash === sha256(this.o.envToken.trim()) : null,
    };
  }
}
