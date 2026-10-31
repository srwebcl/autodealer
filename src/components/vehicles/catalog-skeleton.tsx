export function CatalogSkeleton() {
  return (
    <div aria-busy="true" aria-label="Cargando vehículos">
      <div className="flex gap-2 pt-3">
        <div className="h-11 flex-1 animate-pulse rounded-sm bg-graphite-900 lg:max-w-md" />
        <div className="ml-auto h-11 w-11 animate-pulse rounded-sm bg-graphite-900 sm:w-28" />
        <div className="h-11 w-11 animate-pulse rounded-sm bg-graphite-900 sm:w-48" />
      </div>
      <div className="mt-3 flex gap-2 overflow-hidden">
        {Array.from({ length: 8 }, (_, i) => (
          <div key={i} className="h-9 w-24 shrink-0 animate-pulse rounded-sm bg-graphite-900" />
        ))}
      </div>
      <ul className="mt-15 grid gap-x-5 gap-y-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }, (_, i) => (
          <li key={i}>
            <div className="aspect-square animate-pulse rounded-md bg-graphite-900" />
            <div className="space-y-2.5 pt-4">
              <div className="h-3 w-24 animate-pulse rounded bg-graphite-800" />
              <div className="h-6 w-2/3 animate-pulse rounded bg-graphite-800" />
              <div className="h-4 w-1/2 animate-pulse rounded bg-graphite-900" />
              <div className="h-7 w-2/5 animate-pulse rounded bg-graphite-800" />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
