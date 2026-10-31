import { describe, expect, it } from "vitest";
import { googleReviews } from "@/config/google-reviews";

// Las reseñas se cargan a mano: esta prueba evita publicar datos mal formados.
describe("reseñas de Google (selección manual)", () => {
  it("cada reseña tiene autor, texto, estrellas 1–5 y fecha AAAA-MM válida", () => {
    for (const r of googleReviews.reviews) {
      expect(r.author.trim()).not.toBe("");
      expect(r.text.trim()).not.toBe("");
      expect([1, 2, 3, 4, 5]).toContain(r.rating);
      expect(r.date).toMatch(/^\d{4}-(0[1-9]|1[0-2])$/);
      expect(new Date(`${r.date}-01T00:00:00Z`).getTime()).toBeLessThanOrEqual(Date.now());
    }
  });

  it("calificación y total, si existen, son coherentes", () => {
    const { rating, total } = googleReviews;
    if (rating != null) {
      expect(rating).toBeGreaterThanOrEqual(1);
      expect(rating).toBeLessThanOrEqual(5);
    }
    if (total != null) expect(Number.isInteger(total) && total >= googleReviews.reviews.length).toBe(true);
  });

  it("enlaza al perfil oficial en Google Maps", () => {
    expect(googleReviews.profileUrl).toMatch(/^https:\/\/www\.google\.com\/maps\?cid=\d+$/);
  });
});
