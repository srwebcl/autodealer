import Link from "next/link";
import { ArrowRightIcon } from "@/components/ui/icons";
import { type CatalogFilters, filtersToSearch } from "@/lib/vehicles/filters";

/** Páginas visibles: primera, última y vecinas de la actual, con saltos ("…"). */
export function pageWindow(page: number, pageCount: number): (number | "gap")[] {
  const pages = new Set([1, pageCount, page - 1, page, page + 1].filter((p) => p >= 1 && p <= pageCount));
  const sorted = [...pages].sort((a, b) => a - b);
  const out: (number | "gap")[] = [];
  sorted.forEach((p, i) => {
    if (i > 0 && p - sorted[i - 1] > 1) out.push("gap");
    out.push(p);
  });
  return out;
}

export function Pagination({ filters, page, pageCount }: { filters: CatalogFilters; page: number; pageCount: number }) {
  if (pageCount <= 1) return null;
  const href = (p: number) => `/vehiculos${filtersToSearch({ ...filters, pagina: p })}`;
  const base = "grid h-11 min-w-11 place-items-center rounded-sm border px-3 text-sm font-semibold transition-colors";

  return (
    <nav aria-label="Paginación" className="flex items-center justify-center gap-2">
      {page > 1 ? (
        <Link href={href(page - 1)} className={`${base} border-white/12 hover:border-white/40`} aria-label="Página anterior">
          <ArrowRightIcon className="rotate-180" />
        </Link>
      ) : null}
      {pageWindow(page, pageCount).map((p, i) =>
        p === "gap" ? (
          <span key={`gap-${i}`} className="px-1 text-mist" aria-hidden>
            …
          </span>
        ) : (
          <Link
            key={p}
            href={href(p)}
            aria-current={p === page ? "page" : undefined}
            className={`${base} ${p === page ? "border-brand-yellow bg-brand-yellow text-ink" : "border-white/12 hover:border-white/40"}`}
          >
            <span className="sr-only">Página </span>
            {p}
          </Link>
        ),
      )}
      {page < pageCount ? (
        <Link href={href(page + 1)} className={`${base} border-white/12 hover:border-white/40`} aria-label="Página siguiente">
          <ArrowRightIcon />
        </Link>
      ) : null}
    </nav>
  );
}
