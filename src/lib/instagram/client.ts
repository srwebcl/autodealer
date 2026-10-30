import { z } from "zod";
import { childrenPageSchema, graphErrorSchema, type IgChildMedia, type IgMedia, mediaPageSchema } from "./types";

export const ALLOWED_GRAPH_HOSTS = ["graph.facebook.com", "graph.instagram.com"] as const;
export type GraphHost = (typeof ALLOWED_GRAPH_HOSTS)[number];

const MEDIA_FIELDS =
  "id,caption,media_type,media_product_type,media_url,permalink,timestamp,children{id,media_type,media_url}";

// Códigos de Meta: https://developers.facebook.com/docs/graph-api/guides/error-handling
const AUTH_CODES = new Set([102, 190]);
const RATE_LIMIT_CODES = new Set([4, 17, 32, 613, 80002]);

export class InstagramApiError extends Error {
  constructor(
    message: string,
    readonly kind: "auth" | "rate_limit" | "api" | "network" | "invalid_response",
    readonly code?: number,
    readonly status?: number,
  ) {
    super(message);
    this.name = "InstagramApiError";
  }
  /** Reintentar en la misma ejecución solo tiene sentido para fallos transitorios. */
  get retryable() {
    return this.kind === "network" || (this.kind === "api" && (this.status ?? 0) >= 500);
  }
}

export interface InstagramClientOptions {
  token: string;
  userId: string;
  host?: GraphHost;
  version?: string;
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
  maxRetries?: number;
  sleep?: (ms: number) => Promise<void>;
}

/** Elimina el token de cualquier texto antes de registrarlo. */
export function redactToken(text: string, token: string): string {
  let out = text.replace(/access_token=[^&\s"']+/gi, "access_token=[REDACTED]");
  if (token) out = out.split(token).join("[TOKEN]");
  return out;
}

export class InstagramClient {
  private readonly token: string;
  private readonly userId: string;
  private readonly host: GraphHost;
  private readonly version: string;
  private readonly fetchImpl: typeof fetch;
  private readonly timeoutMs: number;
  private readonly maxRetries: number;
  private readonly sleep: (ms: number) => Promise<void>;

  constructor(o: InstagramClientOptions) {
    if (!o.token) throw new InstagramApiError("Falta el token de Instagram", "auth");
    if (!/^\d+$/.test(o.userId)) throw new InstagramApiError("INSTAGRAM_USER_ID inválido", "api");
    this.token = o.token;
    this.userId = o.userId;
    this.host = o.host ?? "graph.facebook.com";
    this.version = o.version ?? "v26.0";
    this.fetchImpl = o.fetchImpl ?? fetch;
    this.timeoutMs = o.timeoutMs ?? 15_000;
    this.maxRetries = o.maxRetries ?? 3;
    this.sleep = o.sleep ?? ((ms) => new Promise((r) => setTimeout(r, ms)));
  }

  private buildUrl(path: string, params: Record<string, string>): URL {
    const url = new URL(`https://${this.host}/${this.version}/${path}`);
    for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
    return url;
  }

  /** Valida una URL de paginación devuelta por Meta (anti-SSRF) y le quita cualquier token. */
  private safeNextUrl(next: string): URL {
    const url = new URL(next);
    if (url.protocol !== "https:" || !(ALLOWED_GRAPH_HOSTS as readonly string[]).includes(url.hostname)) {
      throw new InstagramApiError(`Host de paginación no permitido: ${url.hostname}`, "invalid_response");
    }
    url.searchParams.delete("access_token");
    return url;
  }

  private async request<T>(url: URL, schema: z.ZodType<T>): Promise<T> {
    let lastError: InstagramApiError | undefined;
    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      if (attempt > 0) await this.sleep(Math.min(8_000, 500 * 2 ** (attempt - 1)) + Math.floor(Math.random() * 250));
      try {
        const res = await this.fetchImpl(url, {
          headers: { Authorization: `Bearer ${this.token}` },
          signal: AbortSignal.timeout(this.timeoutMs),
          cache: "no-store",
        });
        const json: unknown = await res.json().catch(() => null);
        const graphError = graphErrorSchema.safeParse(json);
        if (!res.ok || graphError.success) {
          const e = graphError.success ? graphError.data.error : undefined;
          const code = e?.code;
          const kind = code && AUTH_CODES.has(code) ? "auth" : code && RATE_LIMIT_CODES.has(code) ? "rate_limit" : "api";
          const msg = redactToken(`${e?.type ?? "HTTP"} ${code ?? res.status}: ${e?.message ?? res.statusText}`, this.token);
          throw new InstagramApiError(msg, kind, code, res.status);
        }
        const parsed = schema.safeParse(json);
        if (!parsed.success) {
          throw new InstagramApiError(`Respuesta con formato inesperado: ${parsed.error.issues[0]?.message}`, "invalid_response");
        }
        return parsed.data;
      } catch (err) {
        lastError =
          err instanceof InstagramApiError
            ? err
            : new InstagramApiError(redactToken(err instanceof Error ? err.message : String(err), this.token), "network");
        if (!lastError.retryable) throw lastError;
      }
    }
    throw lastError!;
  }

  /** Recorre /media de más reciente a más antigua. El llamador decide cuándo detenerse. */
  async *listMedia(pageSize = 50): AsyncGenerator<IgMedia[]> {
    let url: URL | null = this.buildUrl(`${this.userId}/media`, { fields: MEDIA_FIELDS, limit: String(pageSize) });
    while (url) {
      const page: z.infer<typeof mediaPageSchema> = await this.request(url, mediaPageSchema);
      yield page.data;
      url = page.paging?.next ? this.safeNextUrl(page.paging.next) : null;
    }
  }

  /** Todos los hijos de un carrusel, respetando paginación si Meta la devuelve. */
  async getAllChildren(media: IgMedia): Promise<IgChildMedia[]> {
    if (media.media_type !== "CAROUSEL_ALBUM") return [];
    const children = [...(media.children?.data ?? [])];
    let next = media.children?.paging?.next;
    if (!media.children) {
      // Algunas respuestas omiten el campo anidado: se piden aparte.
      const page = await this.request(this.buildUrl(`${media.id}/children`, { fields: "id,media_type,media_url" }), childrenPageSchema);
      children.push(...page.data);
      next = page.paging?.next;
    }
    while (next) {
      const page = await this.request(this.safeNextUrl(next), childrenPageSchema);
      children.push(...page.data);
      next = page.paging?.next;
    }
    return children;
  }
}
