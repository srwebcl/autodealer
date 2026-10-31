import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Container } from "@/components/layout/container";
import { SlidersIcon, SortIcon } from "@/components/ui/icons";
import { Select } from "@/components/ui/select";
import { ActiveFilters } from "@/components/vehicles/active-filters";
import { CatalogEmpty } from "@/components/vehicles/catalog-empty";
import { CatalogFiltersForm, FILTERS_FORM_ID, FILTERS_SHEET_ID } from "@/components/vehicles/catalog-filters";
import { CatalogSearch } from "@/components/vehicles/catalog-search";
import { CatalogSkeleton } from "@/components/vehicles/catalog-skeleton";
import { Pagination } from "@/components/vehicles/pagination";
import { VehicleGrid } from "@/components/vehicles/vehicle-grid";
import { siteConfig } from "@/config/site";
import { type CatalogFilters, countActiveFilters, filtersToSearch, parseCatalogFilters, SORT_OPTIONS } from "@/lib/vehicles/filters";
import type { CatalogFacets } from "@/server/vehicles/repository";
import { getCatalogFacets, getCatalogPage } from "@/server/vehicles/queries";

export async function generateMetadata({ searchParams }: PageProps<"/vehiculos">): Promise<Metadata> {
  const filters = parseCatalogFilters(await searchParams);
  const filtered = countActiveFilters(filters) > 0 || filters.orden !== "recientes";
  return {
    title: filters.pagina > 1 ? `Vehículos disponibles – página ${filters.pagina}` : "Vehículos disponibles",
    description: "Catálogo de autos disponibles en AutoDealer, La Serena. Filtra por marca, año, precio y más.",
    // Las combinaciones de filtros no se indexan; la paginación sí, con URL propia.
    alternates: { canonical: filters.pagina > 1 && !filtered ? `/vehiculos?pagina=${filters.pagina}` : "/vehiculos" },
    robots: !siteConfig.indexable ? { index: false, follow: false } : filtered ? { index: false, follow: true } : undefined,
  };
}

const chipClass = (active: boolean) =>
  `inline-flex h-9 shrink-0 items-center gap-1.5 rounded-sm border px-3 text-sm whitespace-nowrap transition-colors ${
    active ? "border-brand-yellow bg-brand-yellow/10 text-brand-yellow" : "border-white/10 text-chalk/75 hover:border-white/30 hover:text-chalk"
  }`;

/** Acceso directo por marca: enlaces (funcionan sin JS) que conservan el resto de filtros. */
function MakeShortcuts({ filters, makes }: { filters: CatalogFilters; makes: CatalogFacets["makes"] }) {
  if (makes.length < 2) return null;
  const href = (marca?: string) => `/vehiculos${filtersToSearch({ ...filters, marca, pagina: 1 })}`;
  return (
    <nav aria-label="Filtrar por marca" className="scroll-row -mx-5 mt-3 flex gap-2 overflow-x-auto px-5 sm:-mx-8 sm:px-8">
      <Link href={href(undefined)} scroll={false} className={chipClass(!filters.marca)} aria-current={!filters.marca ? "true" : undefined}>
        Todas
      </Link>
      {makes.map((m) => {
        const active = filters.marca === m.value;
        return (
          <Link key={m.value} href={href(active ? undefined : m.value)} scroll={false} className={chipClass(active)} aria-current={active ? "true" : undefined}>
            {m.value}
            <span className="text-xs tabular-nums opacity-55">{m.count}</span>
          </Link>
        );
      })}
    </nav>
  );
}

async function Catalog({ searchParams }: Pick<PageProps<"/vehiculos">, "searchParams">) {
  const filters = parseCatalogFilters(await searchParams);
  const [result, facets] = await Promise.all([getCatalogPage(filters), getCatalogFacets()]);
  const activeCount = countActiveFilters(filters);

  return (
    <>
      {/* Barra fija bajo la cabecera: el catálogo queda a la vista y los controles a mano. */}
      <div className="sticky top-18 z-20 -mx-5 bg-ink/90 px-5 pt-3 pb-3 backdrop-blur-lg sm:-mx-8 sm:px-8">
        <div className="flex items-center gap-2">
          <div className="flex min-w-0 flex-1 lg:max-w-md">
            <CatalogSearch key={filters.q ?? ""} form={FILTERS_FORM_ID} defaultValue={filters.q} />
          </div>
          <p className="ml-auto hidden text-sm text-mist lg:block" aria-live="polite">
            <strong className="font-semibold text-chalk tabular-nums">{result.total}</strong> {result.total === 1 ? "vehículo" : "vehículos"}
          </p>
          <button
            type="button"
            popoverTarget={FILTERS_SHEET_ID}
            className="relative inline-flex h-11 shrink-0 items-center gap-2 rounded-sm border border-white/10 bg-graphite-900 px-3 text-sm font-semibold text-chalk transition-colors hover:border-white/30 sm:px-4 lg:ml-4"
          >
            <SlidersIcon width={18} height={18} />
            <span className="max-sm:sr-only">Filtros</span>
            {activeCount > 0 ? (
              <span className="grid size-5 place-items-center rounded-full bg-brand-yellow text-[0.7rem] font-bold text-ink tabular-nums max-sm:absolute max-sm:-top-1.5 max-sm:-right-1.5">
                {activeCount}
              </span>
            ) : null}
          </button>
          <div className="shrink-0">
            <Select
              key={filters.orden}
              name="orden"
              form={FILTERS_FORM_ID}
              autoSubmit
              aria-label="Ordenar por"
              defaultValue={filters.orden}
              options={Object.entries(SORT_OPTIONS).map(([value, label]) => ({ value, label }))}
              compactIcon={<SortIcon width={18} height={18} className="text-chalk" />}
              align="right"
              className="h-11! w-11 bg-graphite-900! px-0 sm:w-auto sm:min-w-52 sm:px-3.5"
            />
          </div>
        </div>
        <MakeShortcuts filters={filters} makes={facets.makes} />
      </div>

      {/* Panel lateral con todos los filtros (popover nativo). key: se reinicia y cierra al cambiar los filtros. */}
      <div id={FILTERS_SHEET_ID} key={filtersToSearch(filters)} popover="auto" aria-label="Filtros" className="sheet">
        <CatalogFiltersForm filters={filters} facets={facets} />
      </div>

      <div className={`mt-3 min-h-9 flex-wrap items-center gap-x-4 gap-y-2 ${activeCount > 0 ? "flex" : "flex lg:hidden"}`}>
        <p className="text-sm text-mist lg:hidden" aria-live="polite">
          <strong className="font-semibold text-chalk tabular-nums">{result.total}</strong> {result.total === 1 ? "vehículo" : "vehículos"}
        </p>
        {activeCount > 0 ? <ActiveFilters filters={filters} /> : null}
      </div>

      <div className="mt-3">
        {result.vehicles.length > 0 ? (
          <VehicleGrid vehicles={result.vehicles} headingLevel={2} dense />
        ) : (
          <CatalogEmpty filtered={activeCount > 0} />
        )}
      </div>

      <div className="mt-12">
        <Pagination filters={filters} page={result.page} pageCount={result.pageCount} />
      </div>
    </>
  );
}

export default function VehiclesPage({ searchParams }: PageProps<"/vehiculos">) {
  return (
    <Container className="pt-24 pb-16 sm:pt-28">
      <h1 className="font-display text-[2.1rem] leading-none font-extrabold uppercase italic tracking-tight sm:text-5xl">
        Vehículos <span className="text-brand-yellow">disponibles</span>
      </h1>
      <Suspense fallback={<CatalogSkeleton />}>
        <Catalog searchParams={searchParams} />
      </Suspense>
    </Container>
  );
}
