"use client";

import { type CSSProperties, useEffect, useRef, useState } from "react";
import type { GoogleReview } from "@/config/google-reviews";

/** Reseñas por tanda según columnas: el móvil no recibe un muro de texto de entrada. */
const BATCH: Record<number, number> = { 1: 6, 2: 8, 3: 12 };

/** Retraso acumulado con intervalos cada vez más cortos: entran una a una, acelerando. */
function staggerDelay(step: number): number {
  let total = 0;
  for (let k = 0; k < step; k++) total += Math.max(45, 380 * 0.8 ** k);
  return Math.round(total);
}

function useColumns() {
  const [cols, setCols] = useState(1);
  useEffect(() => {
    const md = window.matchMedia("(min-width: 40rem)");
    const lg = window.matchMedia("(min-width: 64rem)");
    const update = () => setCols(lg.matches ? 3 : md.matches ? 2 : 1);
    update();
    md.addEventListener("change", update);
    lg.addEventListener("change", update);
    return () => {
      md.removeEventListener("change", update);
      lg.removeEventListener("change", update);
    };
  }, []);
  return cols;
}

const AVATAR = ["bg-brand-red text-white", "bg-brand-yellow text-ink", "bg-graphite-600 text-chalk", "bg-chalk text-ink"];

function avatarClass(name: string): string {
  let h = 0;
  for (const ch of name) h = (h * 31 + ch.codePointAt(0)!) >>> 0;
  return AVATAR[h % AVATAR.length];
}

function initials(name: string): string {
  return name
    .replace(/[^\p{L}\s]/gu, " ")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w.charAt(0).toLocaleUpperCase("es-CL"))
    .join("");
}

function Bubble({ review, index, shown, delay }: { review: GoogleReview; index: number; shown: boolean; delay: number }) {
  // Ritmo visual: una de cada cinco burbujas en amarillo de marca.
  const accent = index % 5 === 2;
  return (
    <li className="bubble" data-shown={shown ? "" : undefined} style={{ "--delay": `${delay}ms` } as CSSProperties}>
      <figure>
        <blockquote
          className={`relative rounded-[1.4rem] rounded-bl-md px-5 py-4 leading-relaxed whitespace-pre-line after:absolute after:-bottom-1.5 after:left-5 after:size-3.5 after:rotate-45 after:rounded-[3px] after:bg-[inherit] ${
            accent ? "bg-brand-yellow text-ink" : "bg-graphite-800 text-chalk/90"
          }`}
        >
          {review.text}
        </blockquote>
        <figcaption className="mt-3.5 flex items-center gap-2.5 pl-1">
          <span aria-hidden className={`grid size-8 shrink-0 place-items-center rounded-full text-xs font-bold ${avatarClass(review.author)}`}>
            {initials(review.author) || "·"}
          </span>
          <span className="min-w-0 truncate text-sm font-semibold text-chalk">{review.author}</span>
        </figcaption>
      </figure>
    </li>
  );
}

/**
 * Reseñas como burbujas que aparecen una a una (cada vez más rápido) al entrar en pantalla.
 * Sin JS o con "reducir movimiento" se ven todas sin animación.
 */
export function ReviewBubbles({ reviews }: { reviews: GoogleReview[] }) {
  const cols = useColumns();
  const [pages, setPages] = useState(1);
  const [revealed, setRevealed] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  const batch = BATCH[cols];
  const limit = Math.min(reviews.length, pages * batch);
  const pageStart = (pages - 1) * batch;

  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    // Con "reducir movimiento" no se arma la animación: todo queda visible desde el inicio.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
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
          <ul key={c} className="flex flex-col gap-7">
            {col.map(({ r, i }) => (
              <Bubble key={i} review={r} index={i} shown={revealed} delay={i >= pageStart ? staggerDelay(i - pageStart) : 0} />
            ))}
          </ul>
        ))}
      </div>

      {limit < reviews.length ? (
        <div className="mt-12 flex justify-center">
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
