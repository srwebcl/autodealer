"use client";

import Image, { type StaticImageData } from "next/image";
import { useEffect, useState } from "react";

export interface HeroSlide {
  src: StaticImageData;
  /** Encuadre en móvil (la foto ocupa la mitad superior): clase object-[x_y]. */
  mobilePosition: string;
  /** Encuadre en escritorio (por defecto centrado): clase md:object-[x_y]. */
  desktopPosition?: string;
}

const INTERVAL_MS = 6500;

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  return reduced;
}

/**
 * Fondo del hero con varias fotos en fundido cruzado y acercamiento lento.
 * - La primera foto es la LCP (precargada); el resto se monta tras el evento load.
 * - Se detiene con la pestaña oculta, con "reducir movimiento" o con el botón de pausa.
 */
export function HeroSlideshow({ slides }: { slides: HeroSlide[] }) {
  const [index, setIndex] = useState(0);
  const [ready, setReady] = useState(false);
  const [paused, setPaused] = useState(false);
  const reduced = usePrefersReducedMotion();
  const count = slides.length;

  useEffect(() => {
    const start = () => setReady(true);
    if (document.readyState === "complete") start();
    else window.addEventListener("load", start, { once: true });
    return () => window.removeEventListener("load", start);
  }, []);

  useEffect(() => {
    if (!ready || paused || reduced || count < 2) return;
    const id = window.setInterval(() => {
      if (document.visibilityState === "visible") setIndex((i) => (i + 1) % count);
    }, INTERVAL_MS);
    return () => window.clearInterval(id);
  }, [ready, paused, reduced, count, index]);

  return (
    <>
      {/* Móvil: fotos en la mitad superior. Escritorio: a sangre completa. */}
      <div aria-hidden className="absolute inset-x-0 top-0 -z-20 h-[58svh] overflow-hidden md:inset-0 md:h-auto">
        {slides.map((slide, i) =>
          i === 0 || ready ? (
            <div
              key={slide.src.src}
              className={`absolute inset-0 transition-opacity duration-[1800ms] ease-in-out ${i === index ? "opacity-100" : "opacity-0"}`}
            >
              <Image
                src={slide.src}
                alt=""
                fill
                sizes="100vw"
                quality={80}
                preload={i === 0}
                fetchPriority={i === 0 ? "high" : undefined}
                placeholder={i === 0 ? "blur" : "empty"}
                className={`object-cover ${slide.mobilePosition} ${slide.desktopPosition ?? "md:object-center"} transition-transform duration-[9000ms] ease-out ${
                  i === index ? "scale-100" : "scale-[1.07]"
                }`}
              />
            </div>
          ) : null,
        )}
        <div className="absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-ink to-transparent md:hidden" />
      </div>

      {count > 1 ? (
        <div className="absolute top-21 right-3 z-10 flex items-center gap-2 sm:right-6 md:top-26 lg:right-10">
          <div className="flex items-center gap-1.5">
            {slides.map((slide, i) => (
              <button
                key={slide.src.src}
                type="button"
                onClick={() => setIndex(i)}
                aria-label={`Mostrar imagen ${i + 1} de ${count}`}
                aria-current={i === index ? "true" : undefined}
                className="group grid h-6 place-items-center"
              >
                <span
                  className={`block h-[3px] rounded-full transition-all duration-500 ${
                    i === index ? "w-8 bg-brand-yellow" : "w-4 bg-white/35 group-hover:bg-white/70"
                  }`}
                />
              </button>
            ))}
          </div>
          {!reduced ? (
            <button
              type="button"
              onClick={() => setPaused((p) => !p)}
              aria-label={paused ? "Reanudar imágenes" : "Pausar imágenes"}
              className="grid size-7 place-items-center rounded-full text-white/60 transition-colors hover:bg-white/10 hover:text-white"
            >
              {paused ? (
                <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor" aria-hidden>
                  <path d="M3 1.5v9l7.5-4.5z" />
                </svg>
              ) : (
                <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor" aria-hidden>
                  <path d="M2.5 1.5h2.5v9H2.5zM7 1.5h2.5v9H7z" />
                </svg>
              )}
            </button>
          ) : null}
        </div>
      ) : null}
    </>
  );
}
