import Link from "next/link";
import type { ReactNode } from "react";
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
import { inputClass, labelClass, selectClass } from "./form-styles";

export const FILTERS_FORM_ID = "filtros-catalogo";

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

function Field({ id, label, children }: { id: string; label: string; children: ReactNode }) {
  return (
    <div>
      <label htmlFor={id} className={labelClass}>
        {label}
      </label>
      {children}
    </div>
  );
}

function ChoiceGroup({
  name,
  legend,
  options,
  current,
}: {
  name: string;
  legend: string;
  options: { value: string; label: string; count: number }[];
  current?: string;
}) {
  if (options.length === 0) return null;
  return (
    <fieldset>
      <legend className={labelClass}>{legend}</legend>
      <div className="flex flex-wrap gap-2">
        {[{ value: "", label: "Todos", count: 0 }, ...options].map((o) => (
          <label
            key={o.value || "all"}
            className="cursor-pointer rounded-sm border border-white/12 px-3 py-1.5 text-sm text-chalk/85 transition-colors hover:border-white/35 has-checked:border-brand-yellow has-checked:bg-brand-yellow has-checked:text-ink has-focus-visible:outline-2 has-focus-visible:outline-brand-yellow"
          >
            <input
              type="radio"
              name={name}
              value={o.value}
              defaultChecked={(current ?? "") === o.value}
              className="sr-only"
            />
            {o.label}
            {o.count ? <span className="ml-1 opacity-60">{o.count}</span> : null}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export function CatalogFiltersForm({ filters, facets }: { filters: Filters; facets: CatalogFacets }) {
  const years = yearRange(facets.yearMin, facets.yearMax);
  const prices = priceSteps(facets.priceMin, facets.priceMax);
  const kms = facets.mileageMax == null ? [] : KM_STEPS.filter((k) => k < facets.mileageMax! * 1.5);
  const active = countActiveFilters(filters);

  return (
    <CleanGetForm id={FILTERS_FORM_ID} action="/vehiculos" defaults={{ orden: "recientes" }} className="flex flex-col gap-5">
      {/* El orden vive en la barra de resultados, asociado a este formulario con form=. */}
      <Field id="f-q" label="Buscar">
        <input
          id="f-q"
          name="q"
          type="search"
          defaultValue={filters.q}
          placeholder="Marca, modelo o versión"
          className={inputClass}
        />
      </Field>

      {facets.makes.length > 0 ? (
        <Field id="f-marca" label="Marca">
          <select id="f-marca" name="marca" defaultValue={filters.marca ?? ""} className={selectClass}>
            <option value="">Todas</option>
            {facets.makes.map((m) => (
              <option key={m.value} value={m.value}>
                {m.value} ({m.count})
              </option>
            ))}
          </select>
        </Field>
      ) : null}

      {years.length > 0 ? (
        <div className="grid grid-cols-2 gap-3">
          <Field id="f-anio-min" label="Año desde">
            <select id="f-anio-min" name="anioMin" defaultValue={filters.anioMin ?? ""} className={selectClass}>
              <option value="">Todos</option>
              {years.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </Field>
          <Field id="f-anio-max" label="Año hasta">
            <select id="f-anio-max" name="anioMax" defaultValue={filters.anioMax ?? ""} className={selectClass}>
              <option value="">Todos</option>
              {years.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </Field>
        </div>
      ) : null}

      {prices.length > 0 ? (
        <div className="grid grid-cols-2 gap-3">
          <Field id="f-precio-min" label="Precio desde">
            <select id="f-precio-min" name="precioMin" defaultValue={filters.precioMin ?? ""} className={selectClass}>
              <option value="">Mínimo</option>
              {prices.map((p) => (
                <option key={p} value={p}>
                  {formatClp(p)}
                </option>
              ))}
            </select>
          </Field>
          <Field id="f-precio-max" label="Precio hasta">
            <select id="f-precio-max" name="precioMax" defaultValue={filters.precioMax ?? ""} className={selectClass}>
              <option value="">Máximo</option>
              {prices.map((p) => (
                <option key={p} value={p}>
                  {formatClp(p)}
                </option>
              ))}
            </select>
          </Field>
        </div>
      ) : null}

      {kms.length > 0 ? (
        <Field id="f-km" label="Kilometraje máximo">
          <select id="f-km" name="kmMax" defaultValue={filters.kmMax ?? ""} className={selectClass}>
            <option value="">Cualquiera</option>
            {kms.map((k) => (
              <option key={k} value={k}>
                Hasta {k.toLocaleString("es-CL")} km
              </option>
            ))}
          </select>
        </Field>
      ) : null}

      <ChoiceGroup
        name="transmision"
        legend="Transmisión"
        current={filters.transmision}
        options={facets.transmissions.map((t) => ({
          value: transmissionToParam[t.value],
          label: transmissionLabels[t.value],
          count: t.count,
        }))}
      />
      <ChoiceGroup
        name="combustible"
        legend="Combustible"
        current={filters.combustible}
        options={facets.fuelTypes
          .filter((f) => f.value in fuelToParam)
          .map((f) => ({ value: fuelToParam[f.value as keyof typeof fuelToParam], label: fuelTypeLabels[f.value], count: f.count }))}
      />
      <ChoiceGroup
        name="traccion"
        legend="Tracción"
        current={filters.traccion}
        options={facets.drivetrains.map((d) => ({
          value: drivetrainToParam[d.value],
          label: drivetrainLabels[d.value],
          count: d.count,
        }))}
      />

      <div className="flex flex-col gap-2 pt-1">
        <button
          type="submit"
          className="h-11 rounded-sm bg-brand-red text-sm font-semibold uppercase tracking-[0.08em] text-white transition-colors hover:bg-brand-red-hover"
        >
          Aplicar filtros
        </button>
        {active > 0 ? (
          <Link href="/vehiculos" scroll={false} className="py-2 text-center text-sm text-mist underline-offset-4 hover:text-chalk hover:underline">
            Limpiar filtros
          </Link>
        ) : null}
      </div>
    </CleanGetForm>
  );
}
