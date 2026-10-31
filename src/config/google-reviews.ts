/**
 * Reseñas de Google Business de AutoDealer, seleccionadas a mano por el cliente.
 *
 * Solo reseñas REALES copiadas tal cual desde el perfil de Google (sin editar el texto).
 * Mientras `reviews` esté vacío, la sección no se muestra en la portada.
 * La calificación y el total también se copian del perfil; null = no se muestran.
 */

export interface GoogleReview {
  /** Nombre tal como aparece en Google. */
  author: string;
  /** Estrellas de la reseña (1–5). */
  rating: 1 | 2 | 3 | 4 | 5;
  /** Texto original de la reseña. */
  text: string;
  /** Mes de publicación, AAAA-MM (fecha fija: Google muestra fechas relativas que envejecen). */
  date: string;
}

export const googleReviews: {
  profileUrl: string;
  rating: number | null;
  total: number | null;
  reviews: GoogleReview[];
} = {
  // Ficha de AutoDealer en Google Maps (CID del perfil de Google Business).
  profileUrl: "https://www.google.com/maps?cid=10896608766266616453",
  rating: null,
  total: null,
  reviews: [],
};
