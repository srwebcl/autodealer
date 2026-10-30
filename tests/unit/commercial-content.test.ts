import { describe, expect, it } from "vitest";
import { featureList, parseCommercialContent, plainDescription } from "@/lib/instagram/commercial-content";

// Fragmentos del formato real de @autodealer.cl.
const TUCSON = `🚙🔥 ¡ESPACIO, RENDIMIENTO Y CONFIABILIDAD COREANA: HYUNDAI TUCSON 2.0 CRDI DIESEL 2018! 🔥⛽
¿Buscas una SUV espaciosa? En Autodealer La Serena te presentamos esta impecable Hyundai Tucson año 2018.

Equipada con el elogiado motor 2.0 Turbo Diésel (CRDi). Cuenta con 113.118 km por solo $14.590.000.

📋 DATOS CLAVE
Modelo: Hyundai Tucson

Año: 2018

Precio: $14.590.000

🛠️ EQUIPAMIENTO DESTACADO
⛽ Motor CRDi Diésel: Eficiencia superior de combustible.

🖥️ Tecnología a Bordo: Pantalla multimedia táctil.

🤝 RESPALDO AUTODEALER LA SERENA
💳 Financiamiento: Evaluamos tu crédito automotriz rápido.

🚗 Recibimos tu vehículo: Tomamos tu auto en parte de pago.

📋 Consignación: Automotora con 5.0 estrellas en Google Reviews.

📍 VISÍTANOS
🏠 Av. Balmaceda 1595, esq. Huanhualí (frente a Iglesia de Lourdes), La Serena.

⏰ Lun-Vie 08:30 a 18:30 hrs | Sáb 10:00 a 14:00 hrs.

¡Una Tucson diésel 2018 en este estado y precio es tiro seguro en patio! Escríbenos o visítanos hoy.
#autodealer #hyundai`;

describe("parseCommercialContent (formato AutoDealer)", () => {
  const c = parseCommercialContent(TUCSON)!;

  it("A. titular e introducción conservados", () => {
    expect(c.title).toEqual(["🚙🔥 ¡ESPACIO, RENDIMIENTO Y CONFIABILIDAD COREANA: HYUNDAI TUCSON 2.0 CRDI DIESEL 2018! 🔥⛽"]);
    expect(c.intro).toHaveLength(2);
    expect(c.intro[1]).toContain("por solo $14.590.000");
  });

  it("B. datos clave en el orden original", () => {
    expect(c.keyDataHeading).toBe("DATOS CLAVE");
    expect(c.keyData).toEqual([
      { label: "Modelo", value: "Hyundai Tucson" },
      { label: "Año", value: "2018" },
      { label: "Precio", value: "$14.590.000" },
    ]);
  });

  it("C. equipamiento con ícono, título y texto completo", () => {
    expect(c.equipment?.heading).toBe("EQUIPAMIENTO DESTACADO");
    expect(c.equipment?.items[0]).toEqual({ icon: "⛽", title: "Motor CRDi Diésel", text: "Eficiencia superior de combustible." });
  });

  it("D. respaldo comercial completo (no se elimina)", () => {
    expect(c.backing?.heading).toBe("RESPALDO AUTODEALER LA SERENA");
    expect(c.backing?.items.map((i) => i.title)).toEqual(["Financiamiento", "Recibimos tu vehículo", "Consignación"]);
  });

  it("E. dirección y horario del caption se reemplazan por el bloque oficial", () => {
    expect(JSON.stringify(c)).not.toMatch(/Balmaceda|Lun-Vie/);
  });

  it("F. cierre conservado; hashtags fuera", () => {
    expect(c.closing).toEqual(["¡Una Tucson diésel 2018 en este estado y precio es tiro seguro en patio! Escríbenos o visítanos hoy."]);
    expect(JSON.stringify(c)).not.toContain("#autodealer");
  });

  it("descripción plana y lista de equipamiento sin inventar", () => {
    expect(plainDescription(c)).toContain("¿Buscas una SUV espaciosa?");
    expect(featureList(c)).toEqual(["Motor CRDi Diésel", "Tecnología a Bordo"]);
  });
});

describe("variantes reales", () => {
  it("titular en dos líneas, equipamiento sin títulos, precio en sección propia y cierre con íconos", () => {
    const c = parseCommercialContent(`🔥 ¡DISPONIBLE EN AUTODEALER! 🔥

MAXUS T60 4X4 2023 – MOTOR 2.8 TURBO DIÉSEL: MÁXIMA FUERZA 🛻💨

Si buscas una camioneta aperrada, esta Maxus T60 es la herramienta ideal.

📋 FICHA TÉCNICA Y DETALLES:
Año: 2023

🛠️ EQUIPAMIENTO DESTACADO:
Aire acondicionado

Doble airbag frontal

💰 VALOR CONTADO / OFERTA:
$12.690.000 💵

🤝 FACILIDADES Y SERVICIOS:
💳 Financiamiento automotriz disponible (con pie mínimo, sujeto a evaluación).

📍 ¡Ven a verla y pruébala hoy mismo!

📲 Contáctanos al DM o vía WhatsApp para coordinar tu visita.`)!;
    expect(c.title).toHaveLength(2);
    expect(c.equipment?.items).toEqual([{ text: "Aire acondicionado" }, { text: "Doble airbag frontal" }]);
    expect(c.keyData).toContainEqual({ label: "Valor contado / oferta", value: "$12.690.000" });
    expect(c.backing?.heading).toBe("FACILIDADES Y SERVICIOS");
    expect(c.backing?.items).toHaveLength(1);
    expect(c.closing).toHaveLength(2);
  });

  it("caption sin cierre no inventa uno", () => {
    const c = parseCommercialContent("MG ZS STD 1.5 2020\nTexto.\n\n🤝 RESPALDO AUTODEALER LA SERENA\n💳 Financiamiento: Evaluamos.\n📍 VISÍTANOS\n🏠 Av. Balmaceda 1595, La Serena.")!;
    expect(c.closing).toEqual([]);
  });

  it("caption vacío → null", () => {
    expect(parseCommercialContent("   ")).toBeNull();
  });
});
