"use client";

import { type CSSProperties, useEffect, useRef, useState, useSyncExternalStore } from "react";
import type { GoogleReview } from "@/config/google-reviews";
import { relativeAgo } from "@/lib/utils/relative-time";
import { GoogleG, GoogleStars } from "./google-brand";

/** Reseñas por tanda según columnas: el móvil no recibe un muro de texto de entrada. */
const BATCH: Record<number, number> = { 1: 6, 2: 8, 3: 12 };

/** Retraso acumulado con intervalos cada vez más cortos: entran una a una, acelerando. */
function staggerDelay(step: number): number {
  let total = 0;
  for (let k = 0; k < step; k++) total += Math.max(70, 520 * 0.82 ** k);
  return Math.round(total);
}

// Columnas según el ancho (en el servidor, 1: sin JS se ven todas en una columna).
const MD = "(min-width: 40rem)";
const LG = "(min-width: 64rem)";
function subscribeColumns(cb: () => void) {
  const queries = [MD, LG].map((q) => window.matchMedia(q));
  queries.forEach((m) => m.addEventListener("change", cb));
  return () => queries.forEach((m) => m.removeEventListener("change", cb));
}
const columnsNow = () => (window.matchMedia(LG).matches ? 3 : window.matchMedia(MD).matches ? 2 : 1);
const serverColumns = () => 1;

// "Hoy" en días: estable durante el día; en el servidor no hay fecha (se completa al hidratar).
const subscribeNoop = () => () => {};
const today = () => Math.floor(Date.now() / 86_400_000) * 86_400_000 + 43_200_000;
const noDate = () => null;

const AVATAR_COLORS = ["#1a73e8", "#d93025", "#e37400", "#188038", "#9334e6", "#c5221f", "#007b83", "#b80672"];

function hash(s: string): number {
  let h = 0;
  for (const ch of s) h = (h * 31 + ch.codePointAt(0)!) >>> 0;
  return h;
}

function initial(name: string): string {
  return (name.replace(/[^\p{L}]/gu, "").charAt(0) || "·").toLocaleUpperCase("es-CL");
}

function Bubble({ review, light, shown, delay, now }: { review: GoogleReview; light: boolean; shown: boolean; delay: number; now: number | null }) {
  const surface = light
    ? "bg-white text-[#202124] shadow-[0_24px_50px_-28px_rgba(0,0,0,0.95)]"
    : "bg-graphite-800 text-chalk/90 ring-1 ring-white/[0.06] shadow-[0_24px_50px_-28px_rgba(0,0,0,0.95)]";
  return (
    <li className="bubble" data-shown={shown ? "" : undefined} style={{ "--delay": `${delay}ms` } as CSSProperties}>
      <figure>
        <div className={`bubble-body relative rounded-[1.35rem] rounded-bl-[0.4rem] px-5 pt-4 pb-4.5 ${surface}`}>
          <div className="flex items-center justify-between gap-3">
            <GoogleStars rating={review.rating ?? 5} size={15} />
            <GoogleG size={15} />
          </div>
          <blockquote className={`mt-2.5 text-[0.95rem] leading-relaxed whitespace-pre-line ${light ? "text-[#3c4043]" : ""}`}>{review.text}</blockquote>
          {/* Cola de la burbuja, apuntando al autor. */}
          <svg aria-hidden viewBox="0 0 16 12" width="16" height="12" className={`absolute -bottom-[11px] left-0 ${light ? "text-white" : "text-graphite-800"}`}>
            <path fill="currentColor" d="M0 0h14C11 4 6 9 0 12z" />
          </svg>
        </div>
        <figcaption className="mt-4 flex items-center gap-2.5 pl-0.5">
          <span
            aria-hidden
            className="grid size-8 shrink-0 place-items-center rounded-full text-sm font-medium text-white"
            style={{ backgroundColor: AVATAR_COLORS[hash(review.author) % AVATAR_COLORS.length] }}
          >
            {initial(review.author)}
          </span>
          <span className="min-w-0 leading-tight">
            <span className="block truncate text-sm font-semibold text-chalk">{review.author}</span>
            <span className="block truncate text-xs text-mist">
              {[review.localGuide ? "Local Guide" : null, now !== null ? relativeAgo(review.date, now) : null].filter(Boolean).join(" · ") || " "}
            </span>
          </span>
        </figcaption>
      </figure>
    </li>
  );
}

/**
 * Reseñas como burbujas que brotan una a una (cada vez más rápido) al entrar en pantalla.
 * Sin JS o con "reducir movimiento" se ven sin animación.
 */
export function ReviewBubbles({ reviews }: { reviews: GoogleReview[] }) {
  const cols = useSyncExternalStore(subscribeColumns, columnsNow, serverColumns);
  const now = useSyncExternalStore(subscribeNoop, today, noDate);
  const [pages, setPages] = useState(1);
  const [revealed, setRevealed] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  const batch = BATCH[cols];
  const limit = Math.min(reviews.length, pages * batch);
  const pageStart = (pages - 1) * batch;

  useEffect(() => {
    const el = listRef.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    // Atributo de DOM (no estado): sin JS nunca se ocultan las reseñas.
    el.dataset.armed = "";
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setRevealed(true);
          io.disconnect();
        }
      },
      { threshold: 0.15 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Reparto en columnas por turnos: el orden de aparición recorre las filas de izquierda a derecha.
  const visible = reviews.slice(0, limit);
  const columns = Array.from({ length: cols }, (_, c) => visible.map((r, i) => ({ r, i })).filter(({ i }) => i % cols === c));

  return (
    <div>
      <div ref={listRef} className="bubbles grid items-start gap-x-6 sm:grid-cols-2 lg:grid-cols-3">
        {columns.map((col, c) => (
          <ul key={c} className="flex flex-col gap-8">
            {col.map(({ r, i }) => (
              <Bubble
                key={r.author}
                review={r}
                light={i % 5 === 2}
                now={now}
                shown={revealed}
                delay={i >= pageStart ? staggerDelay(i - pageStart) : 0}
              />
            ))}
          </ul>
        ))}
      </div>

      {limit < reviews.length ? (
        <div className="mt-14 flex justify-center">
          <button
            type="button"
            onClick={() => setPages((p) => p + 1)}
            className="inline-flex h-12 items-center gap-2 rounded-full border border-white/20 px-6 text-sm font-semibold uppercase tracking-[0.1em] text-chalk transition-colors hover:border-brand-yellow hover:text-brand-yellow"
          >
            Ver más opiniones <span className="text-mist tabular-nums">({reviews.length - limit})</span>
          </button>
        </div>
      ) : null}
    </div>
  );
}
