/**
 * Puntos clave de la consignación, entregados por AutoDealer (texto del cliente).
 * El banner del inicio muestra solo los títulos. (El quinto punto original se quitó a pedido
 * del cliente: repetía el 3 y el 4.)
 */
export const CONSIGNMENT_POINTS = [
  {
    title: "Contrato transparente",
    items: ["Comisiones pactadas, plazos y valor final por escrito.", "Sin letra chica ni sorpresas de último minuto."],
  },
  {
    title: "Pago 100% garantizado",
    items: ["Transferencia directa y acreditada previo a la entrega del vehículo.", "Cero riesgo a fraudes o estafas."],
  },
  {
    title: "Reputación comprobada",
    items: ["Revisa opiniones reales en Google Reviews; la experiencia de otros dueños respalda el servicio."],
    googleReviews: true,
  },
  {
    title: "Custodia y vitrina activa",
    items: ["Tu auto debe estar siempre limpio, resguardado con seguridad y publicado con fotografía profesional."],
  },
] as const;

export const CONSIGNMENT_TITLE = "4 puntos clave para la consignación de tu auto";
