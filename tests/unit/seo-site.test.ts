import { afterEach, describe, expect, it, vi } from "vitest";
import { breadcrumbJsonLd, businessJsonLd, websiteJsonLd } from "@/lib/seo/business";

describe("datos estructurados del sitio", () => {
  it("automotora: dirección, horario y contacto confirmados", () => {
    const d = businessJsonLd();
    expect(d["@type"]).toBe("AutoDealer");
    expect(d.address).toMatchObject({ streetAddress: "Avenida Balmaceda 1595", addressLocality: "La Serena", addressCountry: "CL" });
    expect(d.telephone).toBe("+56967546248");
    expect(d.openingHoursSpecification).toEqual([
      { "@type": "OpeningHoursSpecification", dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"], opens: "08:30", closes: "18:30" },
      { "@type": "OpeningHoursSpecification", dayOfWeek: ["Saturday"], opens: "10:00", closes: "14:00" },
    ]);
    // Sin valoraciones propias: Google no las acepta para negocios locales.
    expect(d).not.toHaveProperty("aggregateRating");
  });

  it("sitio con buscador del catálogo", () => {
    const d = websiteJsonLd() as { potentialAction: { target: { urlTemplate: string } } };
    expect(d.potentialAction.target.urlTemplate).toMatch(/\/vehiculos\?q=\{search_term_string\}$/);
  });

  it("migas de pan numeradas con URL absoluta", () => {
    const d = breadcrumbJsonLd([{ name: "Inicio", path: "/" }, { name: "Vehículos", path: "/vehiculos" }]) as { itemListElement: { position: number; item: string }[] };
    expect(d.itemListElement.map((i) => i.position)).toEqual([1, 2]);
    expect(d.itemListElement[1].item).toMatch(/^https?:\/\/.+\/vehiculos$/);
  });
});

describe("IndexNow", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("no avisa si el sitio no es indexable", async () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_INDEXABLE", "false");
    const { submitIndexNow } = await import("@/lib/seo/indexnow");
    const fetchImpl = vi.fn();
    expect(await submitIndexNow(["/"], fetchImpl)).toMatchObject({ sent: 0 });
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("envía host, clave y URLs absolutas sin duplicados desde el dominio final", async () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_INDEXABLE", "true");
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://www.autodealer.cl");
    const { submitIndexNow, INDEXNOW_KEY } = await import("@/lib/seo/indexnow");
    const fetchImpl = vi.fn(async () => new Response(null, { status: 202 }));
    const r = await submitIndexNow(["/", "/vehiculos", "/vehiculos"], fetchImpl as unknown as typeof fetch);
    expect(r).toEqual({ sent: 2, status: 202 });
    const body = JSON.parse((fetchImpl.mock.calls[0] as unknown as [string, RequestInit])[1].body as string);
    expect(body).toEqual({
      host: "www.autodealer.cl",
      key: INDEXNOW_KEY,
      keyLocation: "https://www.autodealer.cl/indexnow-key.txt",
      urlList: ["https://www.autodealer.cl/", "https://www.autodealer.cl/vehiculos"],
    });
    expect(INDEXNOW_KEY).toMatch(/^[a-f0-9]{32}$/);
  });
});
