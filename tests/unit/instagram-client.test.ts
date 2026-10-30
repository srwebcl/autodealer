import { describe, expect, it } from "vitest";
import { InstagramApiError, InstagramClient, redactToken } from "@/lib/instagram/client";

const TOKEN = "EAATOKENSECRETO123";
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

function client(handler: (url: URL, init?: RequestInit) => Response | Promise<Response>, calls: URL[] = []) {
  return new InstagramClient({
    token: TOKEN,
    userId: "17841400000000000",
    sleep: async () => {},
    fetchImpl: (async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = new URL(String(input));
      calls.push(url);
      return handler(url, init);
    }) as typeof fetch,
  });
}

const media = (id: string, extra = {}) => ({ id, media_type: "IMAGE", timestamp: "2026-10-01T10:00:00+0000", ...extra });

describe("InstagramClient", () => {
  it("envía el token en cabecera, nunca en la URL", async () => {
    const calls: URL[] = [];
    let auth = "";
    const c = client((_u, init) => {
      auth = new Headers(init?.headers).get("authorization") ?? "";
      return json({ data: [media("1")] });
    }, calls);
    for await (const page of c.listMedia()) expect(page).toHaveLength(1);
    expect(auth).toBe(`Bearer ${TOKEN}`);
    expect(calls[0].toString()).not.toContain(TOKEN);
  });

  it("pagina con paging.next y quita access_token de la URL", async () => {
    const calls: URL[] = [];
    const next = `https://graph.facebook.com/v26.0/1/media?after=abc&access_token=${TOKEN}`;
    const c = client((u) => (u.searchParams.get("after") ? json({ data: [media("2")] }) : json({ data: [media("1")], paging: { next } })), calls);
    const ids: string[] = [];
    for await (const page of c.listMedia()) ids.push(...page.map((m) => m.id));
    expect(ids).toEqual(["1", "2"]);
    expect(calls[1].searchParams.has("access_token")).toBe(false);
  });

  it("rechaza paginación hacia hosts no permitidos (SSRF)", async () => {
    const c = client(() => json({ data: [], paging: { next: "https://evil.example/steal" } }));
    const it = c.listMedia();
    await it.next();
    await expect(it.next()).rejects.toMatchObject({ kind: "invalid_response" });
  });

  it("token inválido: error 'auth', sin reintentar y sin filtrar el token", async () => {
    const calls: URL[] = [];
    const c = client(() => json({ error: { message: `Invalid OAuth access token ${TOKEN}`, type: "OAuthException", code: 190 } }, 400), calls);
    const err = await c.listMedia().next().catch((e) => e);
    expect(err).toBeInstanceOf(InstagramApiError);
    expect(err.kind).toBe("auth");
    expect(err.message).not.toContain(TOKEN);
    expect(calls).toHaveLength(1);
  });

  it("límite de uso: error 'rate_limit' sin reintentar", async () => {
    const calls: URL[] = [];
    const c = client(() => json({ error: { message: "limit", code: 4 } }, 400), calls);
    await expect(c.listMedia().next()).rejects.toMatchObject({ kind: "rate_limit" });
    expect(calls).toHaveLength(1);
  });

  it("reintenta errores 5xx y de red", async () => {
    let n = 0;
    const c = client(() => {
      n++;
      if (n === 1) throw new TypeError("fetch failed");
      if (n === 2) return json({ error: { message: "boom", code: 1 } }, 500);
      return json({ data: [media("1")] });
    });
    const r = await c.listMedia().next();
    expect(r.value).toHaveLength(1);
    expect(n).toBe(3);
  });

  it("obtiene hijos paginados de un carrusel", async () => {
    const next = "https://graph.facebook.com/v26.0/9/children?after=x";
    const c = client(() => json({ data: [{ id: "12", media_type: "IMAGE" }] }));
    const kids = await c.getAllChildren(
      media("9", { media_type: "CAROUSEL_ALBUM", children: { data: [{ id: "11", media_type: "IMAGE" }], paging: { next } } }) as never,
    );
    expect(kids.map((k) => k.id)).toEqual(["11", "12"]);
  });
});

describe("redactToken", () => {
  it("borra el token y parámetros access_token", () => {
    expect(redactToken(`x ${TOKEN} y?access_token=abc&z=1`, TOKEN)).toBe("x [TOKEN] y?access_token=[REDACTED]&z=1");
  });
});
