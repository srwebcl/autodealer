"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import type { GoogleReview } from "@/config/google-reviews";
import { relativeAgo } from "@/lib/utils/relative-time";
import { GoogleStars } from "./google-brand";

/** Intervalo entre mensajes: arranca pausado y se acelera hasta un mínimo legible. */
const intervalFor = (k: number) => Math.max(420, 1700 * 0.87 ** k);
const typingFor = (iv: number) => Math.min(900, Math.max(250, iv * 0.55));

// Colores de remitente (grupos de WhatsApp) en tonos de la paleta de Google, legibles sobre oscuro.
const NAME_COLORS = ["#8ab4f8", "#f28b82", "#fdd663", "#81c995", "#c58af9", "#fcad70", "#78d9ec", "#ff8bcb"];
const AVATAR_COLORS = ["#1a73e8", "#d93025", "#e37400", "#188038", "#9334e6", "#c5221f", "#007b83", "#b80672"];

function hash(s: string): number {
  let h = 0;
  for (const ch of s) h = (h * 31 + ch.codePointAt(0)!) >>> 0;
  return h;
}

/** Nombre para "está escribiendo…": completo si es corto ("the players"), si no el primero. */
function shortName(name: string): string {
  const words = name.trim().split(/\s+/);
  return words.length <= 2 ? name.trim() : words[0];
}

function initial(name: string): string {
  return (name.replace(/[^\p{L}]/gu, "").charAt(0) || "·").toLocaleUpperCase("es-CL");
}

// "Hoy" en días: estable durante el día; en el servidor no hay fecha (se completa al hidratar).
const subscribeNoop = () => () => {};
const today = () => Math.floor(Date.now() / 86_400_000) * 86_400_000 + 43_200_000;
const noDate = () => null;

function Message({ review, now, shown }: { review: GoogleReview; now: number | null; shown: boolean }) {
  const h = hash(review.author);
  return (
    <li className="msg flex items-start gap-2" data-shown={shown ? "" : undefined}>
      <span
        aria-hidden
        className="grid size-8 shrink-0 place-items-center rounded-full text-sm font-medium text-white"
        style={{ backgroundColor: AVATAR_COLORS[h % AVATAR_COLORS.length] }}
      >
        {initial(review.author)}
      </span>
      <figure className="relative max-w-[88%] rounded-lg rounded-tl-none bg-[#202c33] px-3 pt-1.5 pb-1.5 shadow-[0_1px_0.5px_rgba(0,0,0,0.25)] sm:max-w-[80%]">
        <svg aria-hidden viewBox="0 0 8 13" width="8" height="13" className="absolute top-0 -left-2 text-[#202c33]">
          <path fill="currentColor" d="M8 0H1.5C.6 0 .1 1 .7 1.7L8 10.5z" />
        </svg>
        <figcaption className="flex flex-wrap items-baseline gap-x-1.5 text-[13px] leading-5">
          <span className="font-semibold" style={{ color: NAME_COLORS[h % NAME_COLORS.length] }}>
            {review.author}
          </span>
          {review.localGuide ? <span className="text-[11px] text-[#8696a0]">· Local Guide</span> : null}
        </figcaption>
        <div className="mt-0.5">
          <GoogleStars rating={review.rating ?? 5} size={12} />
        </div>
        <blockquote className="mt-1 text-[14.5px] leading-[1.45] whitespace-pre-line text-[#e9edef]">{review.text}</blockquote>
        <p className="mt-0.5 text-right text-[11px] text-[#8696a0]">{now !== null ? relativeAgo(review.date, now) : " "}</p>
      </figure>
    </li>
  );
}

function TypingBubble({ name }: { name: string }) {
  return (
    <div className="flex items-start gap-2" aria-hidden>
      <span className="size-8 shrink-0 rounded-full bg-[#2a3942]" />
      <div className="relative flex h-9 items-center gap-1 rounded-lg rounded-tl-none bg-[#202c33] px-4">
        <svg viewBox="0 0 8 13" width="8" height="13" className="absolute top-0 -left-2 text-[#202c33]">
          <path fill="currentColor" d="M8 0H1.5C.6 0 .1 1 .7 1.7L8 10.5z" />
        </svg>
        <span className="typing-dot" />
        <span className="typing-dot [animation-delay:0.15s]" />
        <span className="typing-dot [animation-delay:0.3s]" />
        <span className="sr-only">{name} está escribiendo</span>
      </div>
    </div>
  );
}

/**
 * Ventana de chat estilo WhatsApp: las reseñas llegan como mensajes de un grupo, con
 * "escribiendo…" antes de cada una y cada vez más rápido. Sin JS o con "reducir
 * movimiento" se muestran todas, sin animación.
 */
export function ReviewChat({ reviews, profileUrl }: { reviews: GoogleReview[]; profileUrl: string }) {
  const [count, setCount] = useState(0);
  const [typing, setTyping] = useState(false);
  const [running, setRunning] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const stick = useRef(true);
  const now = useSyncExternalStore(subscribeNoop, today, noDate);
  const n = reviews.length;

  // Arma la animación (atributo de DOM: sin JS nada se oculta) y la activa al entrar en pantalla.
  useEffect(() => {
    const root = rootRef.current;
    if (!root || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    root.dataset.armed = "";
    const io = new IntersectionObserver(
      ([entry]) => {
        setRunning(entry.isIntersecting);
        if (!entry.isIntersecting) setTyping(false);
      },
      { threshold: 0.35 },
    );
    io.observe(root);
    return () => io.disconnect();
  }, []);

  // Secuencia: pausa → "escribiendo…" → mensaje, con intervalos cada vez más cortos.
  useEffect(() => {
    if (!running || count >= n) return;
    const iv = intervalFor(count);
    const t1 = window.setTimeout(() => setTyping(true), iv - typingFor(iv));
    const t2 = window.setTimeout(() => {
      setTyping(false);
      setCount((c) => c + 1);
    }, iv);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, [running, count, n]);

  // Baja al último mensaje, salvo que el visitante haya subido a leer.
  useEffect(() => {
    const body = bodyRef.current;
    if (body && stick.current && (count > 0 || typing)) body.scrollTop = body.scrollHeight;
  }, [count, typing]);

  const done = count >= n;
  const next = reviews[count];

  return (
    <div ref={rootRef} className="chat overflow-hidden rounded-2xl border border-white/10 bg-[#0b141a] shadow-[0_30px_80px_-30px_rgba(0,0,0,0.9)]">
      <div className="flex items-center gap-3 bg-[#202c33] px-4 py-3">
        <span aria-hidden className="grid size-10 place-items-center rounded-full bg-brand-yellow font-display text-lg font-extrabold text-ink italic">
          AD
        </span>
        <div className="min-w-0">
          <p className="truncate text-[15px] font-medium text-[#e9edef]">Clientes AutoDealer</p>
          <p className="truncate text-[13px] text-[#8696a0]" aria-live="off">
            {typing && next ? `${shortName(next.author)} está escribiendo…` : "Reseñas publicadas en Google"}
          </p>
        </div>
      </div>

      <div
        ref={bodyRef}
        onScroll={(e) => {
          const el = e.currentTarget;
          stick.current = el.scrollHeight - el.scrollTop - el.clientHeight < 60;
        }}
        className="chat-wallpaper h-[30rem] overflow-y-auto overscroll-contain px-3 py-4 sm:h-[34rem] sm:px-5"
      >
        <p className="mx-auto mb-4 w-fit rounded-lg bg-[#182229] px-3 py-1 text-xs text-[#8696a0] shadow">Reseñas de Google · 5,0 ★</p>
        <ul className="flex flex-col gap-2.5">
          {reviews.map((r, i) => (
            <Message key={r.author} review={r} now={now} shown={i < count} />
          ))}
        </ul>
        {typing && next ? (
          <div className="mt-2.5">
            <TypingBubble name={next.author} />
          </div>
        ) : null}
        {done ? (
          <a
            href={profileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mx-auto mt-4 block w-fit rounded-lg bg-[#182229] px-3 py-1.5 text-xs font-medium text-[#53bdeb] shadow hover:underline"
          >
            Ver todas las reseñas en Google
          </a>
        ) : null}
      </div>

      <a
        href={profileUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2 bg-[#202c33] px-3 py-2.5"
        aria-label="Escribir una reseña en Google"
      >
        <span className="flex h-10 flex-1 items-center rounded-full bg-[#2a3942] px-4 text-[15px] text-[#8696a0]">Escribe tu opinión en Google…</span>
        <span aria-hidden className="grid size-10 place-items-center rounded-full bg-[#00a884] text-[#111b21]">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
            <path d="M1.1 21.8 23 12 1.1 2.2 1 9.8l15.6 2.2L1 14.2z" />
          </svg>
        </span>
      </a>
    </div>
  );
}

