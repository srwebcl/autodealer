/** Normaliza texto a slug: minúsculas, sin tildes, solo [a-z0-9-]. */
export function slugify(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/ñ/g, "n")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

/**
 * Slug estable para un vehículo: marca-modelo-versión-año + sufijo corto.
 * El sufijo (p. ej. derivado del ID de Instagram) evita colisiones entre
 * unidades iguales y no cambia si se re-sincroniza.
 */
export function vehicleSlug(
  v: { make: string; model: string; version?: string | null; year?: number | null },
  uniqueSuffix?: string,
): string {
  const base = slugify([v.make, v.model, v.version, v.year].filter(Boolean).join(" ")).slice(0, 80).replace(/-+$/, "");
  const suffix = uniqueSuffix ? slugify(uniqueSuffix).slice(-8) : "";
  const slug = [base, suffix].filter(Boolean).join("-");
  if (!slug) throw new Error("No se puede generar un slug sin marca/modelo");
  return slug;
}
