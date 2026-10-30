import Link from "next/link";
import { CloseIcon } from "@/components/ui/icons";
import { formatClp } from "@/lib/utils/format";
import {
  type CatalogFilters,
  drivetrainParam,
  FILTER_KEYS,
  filtersToSearch,
  fuelParam,
  transmissionParam,
} from "@/lib/vehicles/filters";
import { drivetrainLabels, fuelTypeLabels, transmissionLabels } from "@/lib/vehicles/labels";

type FilterKey = (typeof FILTER_KEYS)[number];

function label(key: FilterKey, f: CatalogFilters): string {
  switch (key) {
    case "q":
      return `“${f.q}”`;
    case "marca":
      return f.marca!;
    case "anioMin":
      return `Desde ${f.anioMin}`;
    case "anioMax":
      return `Hasta ${f.anioMax}`;
    case "precioMin":
      return `Desde ${formatClp(f.precioMin)}`;
    case "precioMax":
      return `Hasta ${formatClp(f.precioMax)}`;
    case "kmMax":
      return `Hasta ${f.kmMax!.toLocaleString("es-CL")} km`;
    case "combustible":
      return fuelTypeLabels[fuelParam[f.combustible!]];
    case "transmision":
      return transmissionLabels[transmissionParam[f.transmision!]];
    case "traccion":
      return drivetrainLabels[drivetrainParam[f.traccion!]];
  }
}

/** Chips para quitar filtros de a uno. Cada chip es un enlace: funciona sin JS. */
export function ActiveFilters({ filters }: { filters: CatalogFilters }) {
  const active = FILTER_KEYS.filter((k) => filters[k] !== undefined);
  if (active.length === 0) return null;
  return (
    <ul className="flex flex-wrap items-center gap-2" aria-label="Filtros activos">
      {active.map((key) => (
        <li key={key}>
          <Link
            href={`/vehiculos${filtersToSearch({ ...filters, [key]: undefined, pagina: 1 })}`}
            scroll={false}
            className="inline-flex items-center gap-1.5 rounded-sm border border-white/15 bg-white/5 py-1 pr-2 pl-3 text-sm text-chalk transition-colors hover:border-brand-yellow"
            aria-label={`Quitar filtro ${label(key, filters)}`}
          >
            {label(key, filters)}
            <CloseIcon width={14} height={14} />
          </Link>
        </li>
      ))}
      {active.length > 1 ? (
        <li>
          <Link href="/vehiculos" scroll={false} className="px-2 text-sm text-mist underline-offset-4 hover:text-chalk hover:underline">
            Limpiar todo
          </Link>
        </li>
      ) : null}
    </ul>
  );
}
