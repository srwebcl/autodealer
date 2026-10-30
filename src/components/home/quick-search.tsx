import { ArrowRightIcon } from "@/components/ui/icons";

// Opciones provisionales para la maqueta: en la Fase 3 se generan desde el inventario real.
const PRICE_OPTIONS = [8_000_000, 12_000_000, 16_000_000, 20_000_000, 25_000_000, 30_000_000];
const YEAR_OPTIONS = [2024, 2022, 2020, 2018, 2015];

const priceLabel = new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 });

const fieldClass =
  "h-12 w-full appearance-none rounded-sm border border-white/12 bg-ink/70 px-4 pr-10 text-sm text-chalk transition-colors hover:border-white/30 focus:border-brand-yellow focus:outline-none bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22%23a9adb4%22 stroke-width=%222%22><path d=%22M6 9l6 6 6-6%22/></svg>')] bg-[length:16px] bg-[right_0.9rem_center] bg-no-repeat";

/** Formulario GET sin JavaScript: funciona aunque el cliente no hidrate. */
export function QuickSearch() {
  return (
    <form
      action="/vehiculos"
      method="get"
      role="search"
      aria-label="Buscar vehículos"
      className="grid gap-3 rounded-md border border-white/10 bg-graphite-900/80 p-4 shadow-[0_30px_60px_-30px_rgba(0,0,0,0.9)] backdrop-blur-md sm:grid-cols-2 lg:grid-cols-[1.3fr_1fr_1fr_auto] lg:p-5"
    >
      <div>
        <label htmlFor="qs-q" className="mb-1.5 block text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-mist">
          Marca o modelo
        </label>
        <input
          id="qs-q"
          name="q"
          type="search"
          placeholder="Ej: Toyota, CX-5…"
          autoComplete="off"
          className="h-12 w-full rounded-sm border border-white/12 bg-ink/70 px-4 text-sm text-chalk placeholder:text-mist/70 transition-colors hover:border-white/30 focus:border-brand-yellow focus:outline-none"
        />
      </div>
      <div>
        <label htmlFor="qs-price" className="mb-1.5 block text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-mist">
          Precio máximo
        </label>
        <select id="qs-price" name="precioMax" defaultValue="" className={fieldClass}>
          <option value="">Cualquiera</option>
          {PRICE_OPTIONS.map((p) => (
            <option key={p} value={p}>
              Hasta {priceLabel.format(p)}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="qs-year" className="mb-1.5 block text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-mist">
          Año desde
        </label>
        <select id="qs-year" name="anioMin" defaultValue="" className={fieldClass}>
          <option value="">Cualquiera</option>
          {YEAR_OPTIONS.map((y) => (
            <option key={y} value={y}>
              {y} o más nuevo
            </option>
          ))}
        </select>
      </div>
      <button
        type="submit"
        className="inline-flex h-12 items-center justify-center gap-2 self-end rounded-sm bg-brand-red px-7 text-sm font-semibold uppercase tracking-[0.08em] text-white transition-colors hover:bg-brand-red-hover sm:col-span-2 lg:col-span-1"
      >
        Buscar <ArrowRightIcon />
      </button>
    </form>
  );
}
