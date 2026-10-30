import { randomBytes } from "node:crypto";
import { existsSync } from "node:fs";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { createPrismaClient } from "@/lib/db/create-client";
import { InstagramTokenManager } from "@/server/instagram/token";

if (existsSync(".env.local")) process.loadEnvFile(".env.local");
const url = process.env.DATABASE_URL;
const db = url ? createPrismaClient(url) : null;
const PROVIDER = "instagram-test"; // nunca toca la credencial real
const key = randomBytes(32);
const USER = "17841400000000001";
const OLD = "IGAA_TOKEN_VIGENTE_0001";
const NEW = "IGAA_TOKEN_RENOVADO_0002";
const DAY = 86_400_000;

afterAll(async () => {
  await db?.integrationCredential.deleteMany({ where: { provider: PROVIDER } });
  await db?.$disconnect();
});

type Handler = (url: URL, auth: string | null) => { status?: number; body: unknown };
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status });
let logs: { level: string; eventType: string; message: string }[] = [];
let calls: string[] = [];

function manager(handler: Handler, now = new Date(), envToken: string | undefined = OLD) {
  return new InstagramTokenManager({
    db: db!,
    key,
    provider: PROVIDER,
    userId: USER,
    envToken,
    now: () => now,
    log: async (level, eventType, message) => {
      logs.push({ level, eventType, message });
    },
    fetchImpl: (async (input: RequestInfo | URL, init?: RequestInit) => {
      const u = new URL(String(input));
      calls.push(u.pathname);
      const r = handler(u, new Headers(init?.headers).get("authorization"));
      return json(r.body, r.status ?? 200);
    }) as typeof fetch,
  });
}

const meOk = (u: URL, auth: string | null, valid: string[]) =>
  u.pathname.endsWith("/me")
    ? valid.some((t) => auth === `Bearer ${t}`)
      ? { body: { user_id: USER, username: "autodealer.cl" } }
      : { status: 400, body: { error: { code: 190, message: "Invalid OAuth access token" } } }
    : null;

describe.skipIf(!db)("renovación del token de Instagram", () => {
  beforeEach(async () => {
    await db!.integrationCredential.deleteMany({ where: { provider: PROVIDER } });
    logs = [];
    calls = [];
  });

  it("inicializa desde .env tras validarlo y lo guarda cifrado", async () => {
    const m = manager((u, a) => meOk(u, a, [OLD])!);
    expect(await m.getToken()).toBe(OLD);
    const row = await db!.integrationCredential.findUnique({ where: { provider: PROVIDER } });
    expect(row?.ciphertext).toBeTruthy();
    expect(JSON.stringify(row)).not.toContain(OLD);
  });

  it("no inicializa con un token inválido", async () => {
    const m = manager((u, a) => meOk(u, a, [])!);
    await expect(m.getToken()).rejects.toThrow(/inválido/);
    expect(await db!.integrationCredential.findUnique({ where: { provider: PROVIDER } })).toBeNull();
  });

  it("no renueva antes de tiempo (primera renovación a las 24 h)", async () => {
    const t0 = new Date();
    await manager((u, a) => meOk(u, a, [OLD])!, t0).getToken();
    const r = await manager((u, a) => meOk(u, a, [OLD])!, new Date(t0.getTime() + 3_600_000)).refreshIfDue();
    expect(r.status).toBe("not_due");
    expect(calls).not.toContain("/refresh_access_token");
  });

  it("renueva, valida el nuevo y recién entonces reemplaza", async () => {
    const t0 = new Date();
    await manager((u, a) => meOk(u, a, [OLD])!, t0).getToken();
    const later = new Date(t0.getTime() + 2 * DAY);
    const m = manager((u, a) => meOk(u, a, [OLD, NEW]) ?? { body: { access_token: NEW, token_type: "bearer", expires_in: 5184000 } }, later);
    const r = await m.refreshIfDue();
    expect(r.status).toBe("refreshed");
    expect(await m.getToken()).toBe(NEW);
    const s = await m.status();
    expect(s?.lastRefreshedAt?.getTime()).toBe(later.getTime());
    expect(s?.nextRefreshAt.getTime()).toBe(later.getTime() + 50 * DAY);
    expect(Math.round((s!.expiresAt!.getTime() - later.getTime()) / DAY)).toBe(60);
  });

  it("si el token renovado no valida, conserva el vigente y alerta", async () => {
    const t0 = new Date();
    await manager((u, a) => meOk(u, a, [OLD])!, t0).getToken();
    const m = manager((u, a) => meOk(u, a, [OLD]) ?? { body: { access_token: NEW, expires_in: 5184000 } }, new Date(t0.getTime() + 2 * DAY));
    const r = await m.refreshIfDue();
    expect(r.status).toBe("failed");
    expect(await m.getToken()).toBe(OLD);
    expect(logs.some((l) => l.level === "ERROR" && l.eventType === "token.refresh_failed")).toBe(true);
    expect((await m.status())?.refreshFailures).toBe(1);
  });

  it("si la API de renovación falla, conserva el vigente sin filtrar el token", async () => {
    const t0 = new Date();
    await manager((u, a) => meOk(u, a, [OLD])!, t0).getToken();
    const m = manager(
      (u, a) => meOk(u, a, [OLD]) ?? { status: 400, body: { error: { code: 190, message: `Error validating access token ${OLD}` } } },
      new Date(t0.getTime() + 2 * DAY),
    );
    const r = await m.refreshIfDue();
    expect(r.status).toBe("failed");
    expect(await m.getToken()).toBe(OLD);
    const s = await m.status();
    expect(s?.lastRefreshError).not.toContain(OLD);
    expect(JSON.stringify(logs)).not.toContain(OLD);
  });

  it("alerta cuando el vencimiento está cerca", async () => {
    const t0 = new Date();
    await manager((u, a) => meOk(u, a, [OLD])!, t0).getToken();
    await db!.integrationCredential.update({
      where: { provider: PROVIDER },
      data: { lastRefreshedAt: t0, expiresAt: new Date(t0.getTime() + 3 * DAY) },
    });
    await manager((u, a) => meOk(u, a, [OLD])!, t0).refreshIfDue();
    expect(logs.some((l) => l.eventType === "token.expiring")).toBe(true);
  });

  it("adopta un token nuevo puesto a mano en .env, solo si es válido", async () => {
    const t0 = new Date();
    await manager((u, a) => meOk(u, a, [OLD])!, t0).getToken();
    // Token nuevo inválido en .env → se mantiene el guardado.
    expect(await manager((u, a) => meOk(u, a, [OLD])!, t0, "IGAA_MANUAL_INVALIDO").getToken()).toBe(OLD);
    // Token nuevo válido → se adopta.
    expect(await manager((u, a) => meOk(u, a, [NEW])!, t0, NEW).getToken()).toBe(NEW);
  });

  it("rechaza un token de otra cuenta", async () => {
    const m = manager((u) => (u.pathname.endsWith("/me") ? { body: { user_id: "999" } } : { body: {} }));
    await expect(m.getToken()).rejects.toThrow(/otra cuenta/);
  });
});
