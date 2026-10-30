const clp = new Intl.NumberFormat("es-CL", {
  style: "currency",
  currency: "CLP",
  maximumFractionDigits: 0,
});

const integer = new Intl.NumberFormat("es-CL", { maximumFractionDigits: 0 });

function isUsableNumber(value: number | null | undefined): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0;
}

/** `14590000` → `$14.590.000`. Devuelve null si el valor no es utilizable. */
export function formatClp(value: number | null | undefined): string | null {
  return isUsableNumber(value) ? clp.format(Math.round(value)) : null;
}

/** `113118` → `113.118 km`. */
export function formatKm(value: number | null | undefined): string | null {
  return isUsableNumber(value) ? `${integer.format(Math.round(value))} km` : null;
}

export function vehicleTitle(v: { make: string; model: string }): string {
  return `${v.make} ${v.model}`.trim();
}
