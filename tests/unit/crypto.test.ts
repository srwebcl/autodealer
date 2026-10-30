import { randomBytes } from "node:crypto";
import { describe, expect, it } from "vitest";
import { decrypt, encrypt, parseEncryptionKey } from "@/lib/security/crypto";

const key = randomBytes(32);

describe("AES-256-GCM", () => {
  it("cifra y descifra", () => {
    const e = encrypt("IGAAtoken-secreto", key);
    expect(e.ciphertext).not.toContain("secreto");
    expect(decrypt(e, key)).toBe("IGAAtoken-secreto");
  });
  it("IV distinto en cada cifrado", () => {
    expect(encrypt("x", key).iv).not.toBe(encrypt("x", key).iv);
  });
  it("detecta alteraciones", () => {
    const e = encrypt("token", key);
    const tampered = { ...e, ciphertext: Buffer.from("otro texto").toString("base64") };
    expect(() => decrypt(tampered, key)).toThrow();
  });
  it("falla con otra clave", () => {
    expect(() => decrypt(encrypt("token", key), randomBytes(32))).toThrow();
  });
  it("valida la clave", () => {
    expect(() => parseEncryptionKey(undefined)).toThrow(/no está definida/);
    expect(() => parseEncryptionKey(Buffer.alloc(16).toString("base64"))).toThrow(/32 bytes/);
    expect(parseEncryptionKey(key.toString("base64"))).toHaveLength(32);
  });
});
