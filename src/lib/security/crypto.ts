import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

/** Cifrado autenticado AES-256-GCM. La clave viene de TOKEN_ENCRYPTION_KEY (32 bytes en base64). */

export interface Encrypted {
  ciphertext: string;
  iv: string;
  authTag: string;
}

export function parseEncryptionKey(raw: string | undefined): Buffer {
  if (!raw) throw new Error("TOKEN_ENCRYPTION_KEY no está definida");
  const key = Buffer.from(raw, "base64");
  if (key.length !== 32) throw new Error("TOKEN_ENCRYPTION_KEY debe ser de 32 bytes en base64 (openssl rand -base64 32)");
  return key;
}

export function encrypt(plaintext: string, key: Buffer): Encrypted {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  return { ciphertext: ciphertext.toString("base64"), iv: iv.toString("base64"), authTag: cipher.getAuthTag().toString("base64") };
}

export function decrypt(data: Encrypted, key: Buffer): string {
  const decipher = createDecipheriv("aes-256-gcm", key, Buffer.from(data.iv, "base64"));
  decipher.setAuthTag(Buffer.from(data.authTag, "base64"));
  // Lanza si el texto o la etiqueta fueron alterados.
  return Buffer.concat([decipher.update(Buffer.from(data.ciphertext, "base64")), decipher.final()]).toString("utf8");
}

/** Huella no reversible para comparar tokens sin guardarlos. */
export function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}
