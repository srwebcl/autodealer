import Link from "next/link";
import type { ReactNode } from "react";
import { CloseIcon } from "@/components/ui/icons";
import { formatClp } from "@/lib/utils/format";
import {
  type CatalogFilters as Filters,
  countActiveFilters,
  drivetrainParam,
  fuelParam,
  transmissionParam,
} from "@/lib/vehicles/filters";
import { drivetrainLabels, fuelTypeLabels, transmissionLabels } from "@/lib/vehicles/labels";
import type { CatalogFacets } from "@/server/vehicles/repository";
import { CleanGetForm } from "./clean-get-form";
import { Select } from "@/components/ui/select";

export const FILTERS_FORM_ID = "filtros-catalogo";
export const FILTERS_SHEET_ID = "panel-filtros";

/** Escalones de precio dentro del rango real del inventario. */
function priceSteps(min: number | null, max: number | null): number[] {
  if (min == null || max == null) return [];
  const steps = [5, 8, 10, 12, 15, 18, 20, 25, 30, 35, 40, 50, 60, 80, 100].map((m) => m * 1_000_000);
  return steps.filter((s) => s >= min * 0.8 && s <= max * 1.2);
}

function yearRange(min: number | null, max: number | null): number[] {
  if (min == null || max == null) return [];
  return Array.from({ length: max - min + 1 }, (_, i) => max - i);
}

const KM_STEPS = [20_000, 50_000, 80_000, 100_000, 150_000, 200_000];

/** Inverso de los mapas de URL: enum → valor de URL. */
function invert<T extends Record<string, string>>(map: T) {
  return Object.fromEntries(Object.entries(map).map(([k, v]) => [v, k])) as Record<T[keyof T], keyof T & string>;
}
const fuelToParam = invert(fuelParam);
const transmissionToParam = invert(transmissionParam);
const drivetrainToParam = invert(drivetrainParam);

const legendClass = "mb-3 text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-mist";

function Section({ legend, children }: { legend: string; children: ReactNode }) {
  return (
    <div className="border-t border-white/8 py-5 first:border-t-0 first:pt-1">
      <fieldset>
        <legend className={legendClass}>{legend}</legend>
        {children}
      </fieldset>
    </div>
  );
}

type Option = { value: string; label: string; count?: number };

/** Opciones excluyentes como chips (radios nativos: funcionan sin JS y con teclado). */
function Chips({ name, options, current, allLabel = "Todos" }: { name: string; options: Option[]; current?: string | number; allLabel?: string }) {
  return (
    <div className="flex flex-wrap gap-2">
      {[{ value: "", label: allLabel }, ...options].map((o) => (
        <label
          key={o.value || "all"}
          className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-sm border border-white/10 bg-white/[0.03] px-3 text-sm text-chalk/80 transition-colors select-none hover:border-white/30 hover:text-chalk has-checked:border-brand-yellow has-checked:bg-brand-yellow/10 has-checked:text-brand-yellow has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-brand-yellow"
        >
          <input type="radio" name={name} value={o.value} defaultChecked={String(current ?? "") === o.value} className="sr-only" />
          {o.label}
          {o.count ? <span className="text-xs tabular-nums opacity-55">{o.count}</span> : null}
        </label>
      ))}
    </div>
  );
}

function Range({ children }: { children: [ReactNode, ReactNode] }) {
  return (
    <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
      {children[0]}
      <span aria-hidden className="text-mist">
        –
      </span>
      {children[1]}
    </div>
  );
}

/**
 * Formulario completo de filtros dentro del panel lateral. Un solo <form> en el DOM:
 * la búsqueda y el orden de la barra se asocian a él con el atributo form=.
 */
export function CatalogFiltersForm({ filters, facets }: { filters: Filters; facets: CatalogFacets }) {
  const years = yearRange(facets.yearMin, facets.yearMax);
  const prices = priceSteps(facets.priceMin, facets.priceMax);
  const kms = facets.mileageMax == null ? [] : KM_STEPS.filter((k) => k < facets.mileageMax! * 1.5);
  const active = countActiveFilters(filters);
  const transmissions = facets.transmissions.map((t) => ({ value: transmissionToParam[t.value], label: transmissionLabels[t.value], count: t.count }));
  const fuels = facets.fuelTypes
    .filter((f) => f.value in fuelToParam)
    .map((f) => ({ value: fuelToParam[f.value as keyof typeof fuelToParam], label: fuelTypeLabels[f.value], count: f.count }));
  const drivetrains = facets.drivetrains.map((d) => ({ value: drivetrainToParam[d.value], label: drivetrainLabels[d.value], count: d.count }));

  return (
    <CleanGetForm id={FILTERS_FORM_ID} action="/vehiculos" defaults={{ orden: "recientes" }} className="flex h-full flex-col">
      <div className="flex h-16 shrink-0 items-center justify-between border-b border-white/8 px-5">
        <p className="font-display text-2xl font-extrabold uppercase italic tracking-tight">Filtros</p>
        <button
          type="button"
          popoverTarget={FILTERS_SHEET_ID}
          popoverTargetAction="hide"
          className="-mr-2 grid size-10 place-items-center rounded-sm text-mist hover:bg-white/5 hover:text-chalk"
          aria-label="Cerrar filtros"
        >
          <CloseIcon />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto overscroll-contain px-5 py-4">
        {facets.makes.length > 0 ? (
          <Section legend="Marca">
            <Chips name="marca" allLabel="Todas" current={filters.marca} options={facets.makes.map((m) => ({ value: m.value, label: m.value, count: m.count }))} />
          </Section>
        ) : null}

        {prices.length > 0 ? (
          <Section legend="Precio">
            <Range>
              <Select name="precioMin" aria-label="Precio desde" placeholder="Desde" emptyOption="Cualquiera" defaultValue={filters.precioMin != null ? String(filters.precioMin) : ""} options={prices.map((x) => ({ value: String(x), label: formatClp(x) ?? String(x) }))} className="h-10 bg-graphite-900" />
              <Select name="precioMax" aria-label="Precio hasta" placeholder="Hasta" emptyOption="Cualquiera" defaultValue={filters.precioMax != null ? String(filters.precioMax) : ""} options={prices.map((x) => ({ value: String(x), label: formatClp(x) ?? String(x) }))} className="h-10 bg-graphite-900" />
            </Range>
          </Section>
        ) : null}

        {years.length > 0 ? (
          <Section legend="Año">
            <Range>
              <Select name="anioMin" aria-label="Año desde" placeholder="Desde" emptyOption="Cualquiera" defaultValue={filters.anioMin != null ? String(filters.anioMin) : ""} options={years.map((x) => ({ value: String(x), label: String(x) }))} className="h-10 bg-graphite-900" />
              <Select name="anioMax" aria-label="Año hasta" placeholder="Hasta" emptyOption="Cualquiera" defaultValue={filters.anioMax != null ? String(filters.anioMax) : ""} options={years.map((x) => ({ value: String(x), label: String(x) }))} className="h-10 bg-graphite-900" />
            </Range>
          </Section>
        ) : null}

        {kms.length > 0 ? (
          <Section legend="Kilometraje">
            <Chips name="kmMax" allLabel="Cualquiera" current={filters.kmMax} options={kms.map((k) => ({ value: String(k), label: `Hasta ${k / 1000}.000 km` }))} />
          </Section>
        ) : null}

        {transmissions.length > 0 ? (
          <Section legend="Transmisión">
            <Chips name="transmision" current={filters.transmision} options={transmissions} />
          </Section>
        ) : null}
        {fuels.length > 0 ? (
          <Section legend="Combustible">
            <Chips name="combustible" current={filters.combustible} options={fuels} />
          </Section>
        ) : null}
        {drivetrains.length > 0 ? (
          <Section legend="Tracción">
            <Chips name="traccion" current={filters.traccion} options={drivetrains} />
          </Section>
        ) : null}
      </div>

      <div className="grid shrink-0 grid-cols-[auto_1fr] items-center gap-3 border-t border-white/8 bg-graphite-950 px-5 py-4">
        {active > 0 ? (
          <Link href="/vehiculos" scroll={false} className="px-2 text-sm font-medium text-mist underline-offset-4 hover:text-chalk hover:underline">
            Limpiar
          </Link>
        ) : (
          <span />
        )}
        <button
          type="submit"
          className="h-12 rounded-sm bg-brand-red text-sm font-semibold uppercase tracking-[0.1em] text-white transition-colors hover:bg-brand-red-hover"
        >
          Ver resultados
        </button>
      </div>
    </CleanGetForm>
  );
}
