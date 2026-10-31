const DAY = 86_400_000;

/**
 * Fecha relativa al estilo de Google ("Hace 2 meses", "Hace un año").
 * `date` en AAAA-MM-DD; `now` en milisegundos.
 */
export function relativeAgo(date: string, now: number): string {
  const days = Math.max(0, Math.floor((now - Date.parse(`${date}T12:00:00Z`)) / DAY));
  if (days < 1) return "Hoy";
  if (days < 7) return days === 1 ? "Hace un día" : `Hace ${days} días`;
  if (days < 30) {
    const w = Math.floor(days / 7);
    return w === 1 ? "Hace una semana" : `Hace ${w} semanas`;
  }
  if (days < 365) {
    const m = Math.floor(days / 30);
    return m <= 1 ? "Hace un mes" : `Hace ${m} meses`;
  }
  const y = Math.floor(days / 365);
  return y === 1 ? "Hace un año" : `Hace ${y} años`;
}
