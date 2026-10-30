import { AwsClient } from "aws4fetch";
import { z } from "zod";
import { publicImageUrl } from "./public-url";

const r2EnvSchema = z.object({
  R2_ACCOUNT_ID: z.string().regex(/^[a-f0-9]{32}$/i, "R2_ACCOUNT_ID debe ser el ID de cuenta (32 hex)"),
  R2_ACCESS_KEY_ID: z.string().min(16),
  R2_SECRET_ACCESS_KEY: z.string().min(32),
  R2_BUCKET_NAME: z.string().regex(/^[a-z0-9][a-z0-9-]{1,61}[a-z0-9]$/),
});

export type R2Env = z.infer<typeof r2EnvSchema>;

export function getR2Env(source: Record<string, string | undefined> = process.env): R2Env {
  const r = r2EnvSchema.safeParse(source);
  if (!r.success) {
    // Solo nombres de variables, nunca valores.
    throw new Error(`Configuración de R2 inválida: ${r.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ")}`);
  }
  return r.data;
}

/** Interfaz mínima que usa la sincronización (permite pruebas con un almacenamiento falso). */
export interface ObjectStorage {
  exists(key: string): Promise<boolean>;
  put(key: string, body: Uint8Array, contentType: string): Promise<void>;
  delete(key: string): Promise<void>;
  publicUrl(key: string): string;
}

export class R2Storage implements ObjectStorage {
  private readonly client: AwsClient;
  private readonly endpoint: string;

  constructor(private readonly env: R2Env) {
    this.client = new AwsClient({
      accessKeyId: env.R2_ACCESS_KEY_ID,
      secretAccessKey: env.R2_SECRET_ACCESS_KEY,
      service: "s3",
      region: "auto",
    });
    this.endpoint = `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${env.R2_BUCKET_NAME}`;
  }

  private url(key: string) {
    return `${this.endpoint}/${key.split("/").map(encodeURIComponent).join("/")}`;
  }

  async exists(key: string) {
    const res = await this.client.fetch(this.url(key), { method: "HEAD", signal: AbortSignal.timeout(15_000) });
    if (res.status === 404) return false;
    if (!res.ok) throw new Error(`R2 HEAD ${res.status}`);
    return true;
  }

  async put(key: string, body: Uint8Array, contentType: string) {
    const res = await this.client.fetch(this.url(key), {
      method: "PUT",
      body: body as BodyInit,
      headers: {
        "Content-Type": contentType,
        // Clave inmutable (incluye el ID del medio): caché larga en navegadores/CDN.
        "Cache-Control": "public, max-age=31536000, immutable",
      },
      signal: AbortSignal.timeout(30_000),
    });
    if (!res.ok) throw new Error(`R2 PUT ${res.status}: ${(await res.text()).slice(0, 200)}`);
  }

  async delete(key: string) {
    const res = await this.client.fetch(this.url(key), { method: "DELETE", signal: AbortSignal.timeout(15_000) });
    if (!res.ok && res.status !== 404) throw new Error(`R2 DELETE ${res.status}`);
  }

  publicUrl(key: string) {
    return publicImageUrl(key)!;
  }

  /** Para verificar el alcance de la credencial: listar buckets debe estar prohibido. */
  async canListBuckets(): Promise<boolean> {
    const res = await this.client.fetch(`https://${this.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com/`, {
      signal: AbortSignal.timeout(15_000),
    });
    return res.ok;
  }

  /** ¿La credencial puede escribir en otro bucket? Debe ser falso. */
  async canWriteToBucket(bucket: string): Promise<{ allowed: boolean; status: number }> {
    const res = await this.client.fetch(
      `https://${this.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${bucket}/autodealer-scope-check.txt`,
      { method: "PUT", body: "x", signal: AbortSignal.timeout(15_000) },
    );
    return { allowed: res.ok, status: res.status };
  }

  async get(key: string, ifNoneMatch?: string | null): Promise<Response> {
    return this.client.fetch(this.url(key), {
      headers: ifNoneMatch ? { "If-None-Match": ifNoneMatch } : undefined,
      signal: AbortSignal.timeout(15_000),
    });
  }
}

/** Clave estable e idempotente: el mismo medio de Instagram siempre va al mismo objeto. */
export function instagramImageKey(postMediaId: string, childMediaId: string, ext: string) {
  return `instagram/${postMediaId}/${childMediaId}.${ext}`;
}
