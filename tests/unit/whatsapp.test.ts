import { describe, expect, it } from "vitest";
import { vehicleWhatsappMessage, whatsappUrl } from "@/lib/whatsapp";

describe("whatsappUrl", () => {
  it("usa solo dígitos y codifica el mensaje", () => {
    const url = whatsappUrl("Hola, ¿está disponible?", "+56 9 1234 5678");
    expect(url).toBe("https://wa.me/56912345678?text=Hola%2C%20%C2%BFest%C3%A1%20disponible%3F");
  });
});

describe("vehicleWhatsappMessage", () => {
  it("incluye nombre, año y precio cuando existen", () => {
    const msg = vehicleWhatsappMessage({ make: "Mazda", model: "CX-5", version: "GT", year: 2021, priceClp: 18990000 });
    expect(msg.replace(/\s/g, " ")).toBe("Hola AutoDealer, me interesa el Mazda CX-5 GT 2021, publicado en $18.990.000.");
  });
  it("omite datos ausentes en lugar de inventarlos", () => {
    const msg = vehicleWhatsappMessage({ make: "Toyota", model: "Hilux", year: null, priceClp: null });
    expect(msg).toBe("Hola AutoDealer, me interesa el Toyota Hilux.");
  });
  it("agrega la URL de la ficha", () => {
    const msg = vehicleWhatsappMessage({ make: "Kia", model: "Rio", url: "https://autodealer.cl/vehiculos/kia-rio" });
    expect(msg.endsWith(" https://autodealer.cl/vehiculos/kia-rio")).toBe(true);
  });
});
