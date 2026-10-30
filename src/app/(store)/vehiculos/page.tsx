import type { Metadata } from "next";
import { Suspense } from "react";
import { Container } from "@/components/layout/container";
import { PageHero } from "@/components/layout/page-hero";
import { ActiveFilters } from "@/components/vehicles/active-filters";
import { AutoSubmitSelect } from "@/components/vehicles/auto-submit-select";
import { CatalogEmpty } from "@/components/vehicles/catalog-empty";
import { CatalogFiltersForm, FILTERS_FORM_ID } from "@/components/vehicles/catalog-filters";
import { CatalogSkeleton } from "@/components/vehicles/catalog-skeleton";
import { FiltersDisclosure } from "@/components/vehicles/filters-disclosure";
import { selectClass } from "@/components/vehicles/form-styles";
import { Pagination } from "@/components/vehicles/pagination";
import { VehicleGrid } from "@/components/vehicles/vehicle-grid";
import { siteConfig } from "@/config/site";
import { countActiveFilters, filtersToSearch, parseCatalogFilters, SORT_OPTIONS } from "@/lib/vehicles/filters";
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

async function Catalog({ searchParams }: Pick<PageProps<"/vehiculos">, "searchParams">) {
  const filters = parseCatalogFilters(await searchParams);
  const [result, facets] = await Promise.all([getCatalogPage(filters), getCatalogFacets()]);
  const activeCount = countActiveFilters(filters);

  return (
    <div className="grid gap-6 lg:grid-cols-[17rem_1fr] lg:gap-10">
      <aside aria-label="Filtros">
        <div className="lg:sticky lg:top-24">
          <FiltersDisclosure activeCount={activeCount}>
            {/* key: remonta el formulario cuando cambian los filtros (defaultValue no se actualiza solo). */}
            <CatalogFiltersForm key={filtersToSearch(filters)} filters={filters} facets={facets} />
          </FiltersDisclosure>
        </div>
      </aside>

      <div className="min-w-0">

        <div className="flex flex-col gap-4 border-b border-white/8 pb-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-mist" aria-live="polite">
            <strong className="font-semibold text-chalk">{result.total}</strong>{" "}
            {result.total === 1 ? "vehículo" : "vehículos"}
            {result.pageCount > 1 ? ` · página ${result.page} de ${result.pageCount}` : null}
          </p>
          <div className="flex items-center gap-3">
            <label htmlFor="orden" className="text-xs font-semibold uppercase tracking-[0.14em] text-mist">
              Ordenar
            </label>
            <AutoSubmitSelect
              id="orden"
              name="orden"
              form={FILTERS_FORM_ID}
              key={filters.orden}
              defaultValue={filters.orden}
              className={`${selectClass} w-52`}
            >
              {Object.entries(SORT_OPTIONS).map(([value, text]) => (
                <option key={value} value={value}>
                  {text}
                </option>
              ))}
            </AutoSubmitSelect>
          </div>
        </div>

        {activeCount > 0 ? (
          <div className="mt-5">
            <ActiveFilters filters={filters} />
          </div>
        ) : null}

        <div className="mt-6">
          {result.vehicles.length > 0 ? (
            <VehicleGrid vehicles={result.vehicles} headingLevel={2} />
          ) : (
            <CatalogEmpty filtered={activeCount > 0} />
          )}
        </div>

        <div className="mt-12">
          <Pagination filters={filters} page={result.page} pageCount={result.pageCount} />
        </div>
      </div>
    </div>
  );
}

export default function VehiclesPage({ searchParams }: PageProps<"/vehiculos">) {
  return (
    <>
      <PageHero
        eyebrow="Catálogo"
        title={
          <>
            Vehículos <span className="text-brand-yellow">disponibles</span>
          </>
        }
      >
        <p>Todas las unidades publicadas, con precio y datos clave. Consulta por WhatsApp para coordinar una visita.</p>
      </PageHero>
      <Container className="py-12 sm:py-16">
        <Suspense fallback={<CatalogSkeleton />}>
          <Catalog searchParams={searchParams} />
        </Suspense>
      </Container>
    </>
  );
}
