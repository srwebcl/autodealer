"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { ArrowRightIcon, CloseIcon, SearchIcon, WhatsAppIcon } from "@/components/ui/icons";
import { formatClp, formatKm } from "@/lib/utils/format";
import { describeQuery, type SearchItem, searchVehicles } from "@/lib/vehicles/search";
import { whatsappUrl } from "@/lib/whatsapp";

const MAX_RESULTS = 5;

// Ideas de búsqueda: solo se muestran las que encuentran algo en el inventario actual.
const IDEAS = ["camioneta 4x4", "SUV", "automático", "diésel", "hatchback", "hasta 10 millones", "desde 2022", "furgón"];

const catalogHref = (q: string) => `/vehiculos?q=${encodeURIComponent(q.trim())}`;

function ResultRow({ item, active, id, onHover }: { item: SearchItem; active: boolean; id: string; onHover: () => void }) {
  const meta = [item.year, formatKm(item.mileageKm), item.transmission, item.fuelType].filter(Boolean).join(" · ");
  const price = formatClp(item.priceClp);
  return (
    <li role="option" id={id} aria-selected={active}>
      <Link
        href={`/vehiculos/${item.slug}`}
        onMouseEnter={onHover}
        className={`flex items-center gap-4 px-4 py-3 transition-colors sm:px-5 ${active ? "bg-white/[0.07]" : "hover:bg-white/[0.04]"}`}
      >
        <span className="relative h-14 w-20 shrink-0 overflow-hidden rounded-sm bg-graphite-800">
          {item.image ? <Image src={item.image.src} alt="" fill sizes="80px" className="object-cover" /> : null}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate font-display text-lg leading-tight font-bold uppercase italic">
            {item.make} {item.model}
            {item.version ? <span className="ml-2 font-sans text-sm font-normal normal-case not-italic text-mist">{item.version}</span> : null}
          </span>
          <span className="mt-0.5 block truncate text-sm text-mist">{meta}</span>
        </span>
        <span className="hidden shrink-0 text-right font-semibold text-chalk sm:block">{price ?? "Consultar"}</span>
      </Link>
    </li>
  );
}

/**
 * Buscador único del inicio: entiende marca, modelo, tipo, combustible, transmisión, precio y
 * año, y muestra resultados al instante. Sin JS (o antes de cargar el índice) es un formulario
 * GET normal al catálogo, que usa la misma búsqueda en el servidor.
 */
export function SmartSearch({ items }: { items: SearchItem[] | null }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [tick, setTick] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const listId = useId();

  const ideas = useMemo(() => (items ? IDEAS.filter((idea) => searchVehicles(items, idea).results.length > 0).slice(0, 5) : []), [items]);
  const { query, results } = useMemo(() => (items ? searchVehicles(items, q) : { query: null, results: [] }), [items, q]);
  const shown = results.slice(0, MAX_RESULTS);
  const understood = query ? describeQuery(query) : [];
  const showPanel = Boolean(items) && open && q.trim().length > 0;

  // Ejemplos rotando en el placeholder mientras la caja está vacía.
  useEffect(() => {
    if (ideas.length < 2 || q || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = window.setInterval(() => setTick((t) => t + 1), 2800);
    return () => window.clearInterval(id);
  }, [ideas.length, q]);
  const placeholder = ideas.length ? `Prueba: "${ideas[tick % ideas.length]}"` : "Busca marca, modelo, tipo o presupuesto";

  // El buscador está al pie del hero: al usarlo, sube la página lo justo para ver los resultados.
  function makeRoom() {
    const bar = rootRef.current;
    if (!bar) return;
    const room = window.innerHeight - bar.getBoundingClientRect().top;
    if (room < 460) window.scrollBy({ top: 460 - room, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  }

  function pick(idea: string) {
    setQ(idea);
    setActive(-1);
    setOpen(true);
    inputRef.current?.focus();
    if (idea) makeRoom();
  }

  return (
    <div
      ref={rootRef}
      className="relative"
      onBlur={(e) => {
        if (!rootRef.current?.contains(e.relatedTarget as Node | null)) setOpen(false);
      }}
    >
      <form
        action="/vehiculos"
        method="get"
        role="search"
        aria-label="Buscar vehículos"
        onSubmit={(e) => {
          if (!items) return;
          e.preventDefault();
          if (showPanel && active >= 0 && shown[active]) router.push(`/vehiculos/${shown[active].slug}`);
          else router.push(q.trim() ? catalogHref(q) : "/vehiculos");
        }}
        className="group/bar flex h-16 items-center gap-2 rounded-md border border-white/12 bg-graphite-900/85 pr-2 pl-5 shadow-[0_30px_60px_-30px_rgba(0,0,0,0.9)] backdrop-blur-md transition-[border-color,box-shadow] focus-within:border-brand-yellow/70 focus-within:shadow-[0_0_0_4px_rgba(255,240,0,0.08),0_30px_60px_-30px_rgba(0,0,0,0.9)] sm:h-[4.5rem] sm:pl-6"
      >
        <SearchIcon width={22} height={22} className="shrink-0 text-brand-yellow" aria-hidden />
        <label htmlFor={`${listId}-input`} className="sr-only">
          Busca por marca, modelo, tipo, combustible o presupuesto
        </label>
        <input
          ref={inputRef}
          id={`${listId}-input`}
          name="q"
          type="search"
          value={q}
          onChange={(e) => {
            if (!q && e.target.value) makeRoom();
            setQ(e.target.value);
            setActive(-1);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              setOpen(false);
              setActive(-1);
            } else if (showPanel && shown.length && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
              e.preventDefault();
              const step = e.key === "ArrowDown" ? 1 : -1;
              // Recorre -1 (la caja) → 0…n-1 → -1, en ambos sentidos.
              const n = shown.length + 1;
              setActive((a) => ((a + 1 + step + n) % n) - 1);
            }
          }}
          placeholder={placeholder}
          autoComplete="off"
          enterKeyHint="search"
          role="combobox"
          aria-expanded={showPanel}
          aria-controls={`${listId}-list`}
          aria-autocomplete="list"
          aria-activedescendant={showPanel && active >= 0 ? `${listId}-opt-${active}` : undefined}
          className="h-full min-w-0 flex-1 bg-transparent text-base text-chalk placeholder:text-mist/80 focus:outline-none sm:text-lg [&::-webkit-search-cancel-button]:hidden"
        />
        {q ? (
          <button
            type="button"
            onClick={() => pick("")}
            aria-label="Borrar búsqueda"
            className="grid size-9 shrink-0 place-items-center rounded-full text-mist transition-colors hover:bg-white/10 hover:text-chalk"
          >
            <CloseIcon width={18} height={18} />
          </button>
        ) : null}
        <button
          type="submit"
          className="inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-sm bg-brand-red px-4 text-sm font-semibold uppercase tracking-[0.08em] text-white transition-colors hover:bg-brand-red-hover sm:h-14 sm:px-7"
        >
          <span className="hidden sm:inline">Buscar</span>
          <ArrowRightIcon aria-hidden />
          <span className="sr-only sm:hidden">Buscar</span>
        </button>
      </form>

      {ideas.length ? (
        <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
          <span className="text-mist">Prueba:</span>
          {ideas.map((idea) => (
            <button
              key={idea}
              type="button"
              onClick={() => pick(idea)}
              className="rounded-full border border-white/12 bg-ink/50 px-3 py-1 text-chalk/85 backdrop-blur-sm transition-colors hover:border-brand-yellow hover:text-brand-yellow"
            >
              {idea}
            </button>
          ))}
        </div>
      ) : null}

      {showPanel ? (
        <div className="absolute inset-x-0 top-16 z-40 mt-2 overflow-hidden rounded-md border border-white/12 bg-graphite-900 shadow-[0_40px_80px_-30px_rgba(0,0,0,0.95)] sm:top-[4.5rem]">
          <div className="flex flex-wrap items-center gap-2 border-b border-white/8 px-4 py-3 text-sm sm:px-5" aria-live="polite">
            <span className="font-semibold text-chalk">
              {results.length === 0 ? "Sin resultados" : results.length === 1 ? "1 vehículo" : `${results.length} vehículos`}
            </span>
            {understood.map((u) => (
              <span key={u} className="rounded-full bg-brand-yellow/12 px-2.5 py-0.5 text-xs font-medium text-brand-yellow">
                {u}
              </span>
            ))}
          </div>
          {shown.length ? (
            <>
              <ul id={`${listId}-list`} role="listbox" aria-label="Resultados" className="max-h-[22rem] divide-y divide-white/6 overflow-y-auto">
                {shown.map((item, i) => (
                  <ResultRow key={item.slug} item={item} id={`${listId}-opt-${i}`} active={i === active} onHover={() => setActive(i)} />
                ))}
              </ul>
              <Link
                href={catalogHref(q)}
                className="flex items-center justify-between gap-3 border-t border-white/8 bg-white/[0.03] px-4 py-3.5 text-sm font-semibold uppercase tracking-[0.08em] text-chalk transition-colors hover:text-brand-yellow sm:px-5"
              >
                {results.length > MAX_RESULTS ? `Ver los ${results.length} resultados` : "Ver en el catálogo"}
                <ArrowRightIcon width={18} height={18} />
              </Link>
            </>
          ) : (
            <div id={`${listId}-list`} className="px-4 py-5 sm:px-5">
              <p className="text-chalk/85">
                No encontramos vehículos para <span className="font-semibold text-chalk">«{q.trim()}»</span> en este momento.
              </p>
              <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm font-semibold">
                <Link href="/vehiculos" className="inline-flex items-center gap-1.5 text-chalk hover:text-brand-yellow">
                  Ver todo el catálogo <ArrowRightIcon width={16} height={16} />
                </Link>
                <a
                  href={whatsappUrl(`Hola AutoDealer, busco: ${q.trim()}`)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-[#25d366] hover:underline"
                >
                  <WhatsAppIcon width={16} height={16} /> Pregúntanos por WhatsApp
                </a>
              </div>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
