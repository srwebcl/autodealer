"use client";

import { SearchIcon } from "@/components/ui/icons";

/**
 * Búsqueda de la barra del catálogo. Pertenece al formulario de filtros (atributo form=),
 * que vive en el panel lateral; Enter lo envía de forma explícita.
 */
export function CatalogSearch({ form, defaultValue }: { form: string; defaultValue?: string }) {
  return (
    <div className="relative min-w-0 flex-1">
      <SearchIcon className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-mist" width={18} height={18} />
      <input
        type="search"
        name="q"
        form={form}
        defaultValue={defaultValue}
        placeholder="Buscar marca o modelo"
        aria-label="Buscar marca, modelo o versión"
        enterKeyHint="search"
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            e.currentTarget.form?.requestSubmit();
          }
        }}
        className="h-11 w-full rounded-sm border border-white/10 bg-graphite-900 pr-3 pl-10 text-sm text-chalk placeholder:text-mist/80 transition-colors hover:border-white/25 focus:border-brand-yellow focus:outline-none"
      />
    </div>
  );
}
