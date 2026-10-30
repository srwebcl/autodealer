export function CatalogSkeleton() {
  return (
    <div className="grid gap-10 lg:grid-cols-[17rem_1fr]" aria-busy="true" aria-label="Cargando vehículos">
      <div className="hidden h-[32rem] animate-pulse rounded-md bg-graphite-900 lg:block" />
      <div>
        <div className="mb-6 h-11 w-full animate-pulse rounded-sm bg-graphite-900" />
        <ul className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }, (_, i) => (
            <li key={i} className="overflow-hidden rounded-md border border-white/8 bg-graphite-900">
              <div className="aspect-[4/3] animate-pulse bg-graphite-800" />
              <div className="space-y-3 p-5">
                <div className="h-3 w-16 animate-pulse rounded bg-graphite-700" />
                <div className="h-6 w-2/3 animate-pulse rounded bg-graphite-700" />
                <div className="h-4 w-full animate-pulse rounded bg-graphite-800" />
                <div className="h-7 w-1/2 animate-pulse rounded bg-graphite-700" />
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
