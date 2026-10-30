import { describe, expect, it } from "vitest";
import { downloadImage, isAllowedMediaUrl } from "@/lib/instagram/download";

const JPEG = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 1, 2, 3, 4]);
const ok = (body: Uint8Array, type = "image/jpeg", extra: Record<string, string> = {}) =>
  new Response(body as BodyInit, { status: 200, headers: { "content-type": type, ...extra } });
const fakeFetch = (responses: Record<string, Response>) =>
  (async (input: RequestInfo | URL) => responses[String(input)] ?? new Response(null, { status: 404 })) as typeof fetch;

const CDN = "https://scontent-scl2-1.cdninstagram.com/v/t51/abc.jpg?oh=firmado";

describe("isAllowedMediaUrl", () => {
  it.each([
    [CDN, true],
    ["https://scontent.xx.fbcdn.net/a.jpg", true],
    ["http://scontent.cdninstagram.com/a.jpg", false],
    ["https://evil.com/cdninstagram.com.jpg", false],
    ["https://cdninstagram.com.evil.com/a.jpg", false],
    ["https://169.254.169.254/latest/meta-data", false],
    ["https://user:pass@scontent.cdninstagram.com/a.jpg", false],
    ["no es url", false],
  ])("%s → %s", (url, expected) => {
    expect(isAllowedMediaUrl(url)).toBe(expected);
  });
});

describe("downloadImage", () => {
  it("descarga un JPEG válido", async () => {
    const r = await downloadImage(CDN, { fetchImpl: fakeFetch({ [CDN]: ok(JPEG) }) });
    expect(r.ext).toBe("jpg");
    expect(r.bytes.byteLength).toBe(JPEG.byteLength);
  });

  it("rechaza tipos no permitidos", async () => {
    await expect(downloadImage(CDN, { fetchImpl: fakeFetch({ [CDN]: ok(JPEG, "text/html") }) })).rejects.toThrow(/Tipo no permitido/);
  });

  it("rechaza contenido que no coincide con la firma", async () => {
    const html = new TextEncoder().encode("<html>hola</html>");
    await expect(downloadImage(CDN, { fetchImpl: fakeFetch({ [CDN]: ok(html) }) })).rejects.toThrow(/no coincide/);
  });

  it("corta si supera el tamaño aunque no declare Content-Length", async () => {
    const big = new Uint8Array(2048);
    big.set([0xff, 0xd8, 0xff]);
    await expect(downloadImage(CDN, { fetchImpl: fakeFetch({ [CDN]: ok(big) }), maxBytes: 1024 })).rejects.toThrow(/supera/);
  });

  it("no sigue redirecciones a hosts no permitidos", async () => {
    const redirect = new Response(null, { status: 302, headers: { location: "https://169.254.169.254/x" } });
    await expect(downloadImage(CDN, { fetchImpl: fakeFetch({ [CDN]: redirect }) })).rejects.toThrow(/Host no permitido/);
  });

  it("sigue redirecciones dentro del CDN", async () => {
    const other = "https://scontent-b.cdninstagram.com/b.jpg";
    const redirect = new Response(null, { status: 302, headers: { location: other } });
    const r = await downloadImage(CDN, { fetchImpl: fakeFetch({ [CDN]: redirect, [other]: ok(JPEG) }) });
    expect(r.contentType).toBe("image/jpeg");
  });

  it("no expone la URL firmada en el error", async () => {
    await expect(downloadImage(CDN, { fetchImpl: fakeFetch({}) })).rejects.toThrow(/^(?!.*oh=firmado).*$/);
  });
});
