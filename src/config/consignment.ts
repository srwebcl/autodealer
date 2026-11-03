/**
 * Puntos clave de la consignación, entregados por AutoDealer (texto del cliente).
 * `short` es la versión resumida para el banner del inicio.
 */
export const CONSIGNMENT_POINTS = [
  {
    title: "Contrato transparente",
    short: "Contrato transparente",
    items: ["Comisiones pactadas, plazos y valor final por escrito.", "Sin letra chica ni sorpresas de último minuto."],
  },
  {
    title: "Pago 100% garantizado",
    short: "Pago 100% garantizado",
    items: ["Transferencia directa y acreditada previo a la entrega del vehículo.", "Cero riesgo a fraudes o estafas."],
  },
  {
    title: "Reputación comprobada",
    short: "Reputación comprobada",
    items: ["Revisa opiniones reales en Google Reviews; la experiencia de otros dueños respalda el servicio."],
    googleReviews: true,
  },
  {
    title: "Custodia y vitrina activa",
    short: "Custodia y vitrina activa",
    items: ["Tu auto debe estar siempre limpio, resguardado con seguridad y publicado con fotografía profesional."],
  },
  {
    title: "Vitrina activa y reputación",
    short: null,
    items: ["Publicación profesional y respaldo de Google Reviews."],
    googleReviews: true,
  },
] as const;

export const CONSIGNMENT_TITLE = "5 puntos clave para la consignación de tu auto";
