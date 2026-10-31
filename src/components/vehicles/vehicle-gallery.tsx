"use client";

import Image from "next/image";
import { type KeyboardEvent, type PointerEvent, useCallback, useEffect, useRef, useState } from "react";
import { ArrowRightIcon, CloseIcon } from "@/components/ui/icons";
import type { VehicleImageData } from "@/types/vehicle";
import { VehiclePhotoPlaceholder } from "./vehicle-photo-placeholder";

const SWIPE_THRESHOLD = 40;

export function VehicleGallery({ images, title }: { images: VehicleImageData[]; title: string }) {
  const [index, setIndex] = useState(0);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const pointerStart = useRef<number | null>(null);
  const stripRef = useRef<HTMLUListElement>(null);
  const count = images.length;

  const go = useCallback((delta: number) => setIndex((i) => (i + delta + count) % count), [count]);

  // Mantiene la miniatura activa a la vista dentro de la fila (sin mover la página).
  useEffect(() => {
    const strip = stripRef.current;
    const thumb = strip?.children[index] as HTMLElement | undefined;
    if (!strip || !thumb) return;
    const left = thumb.offsetLeft - strip.offsetLeft;
    if (left < strip.scrollLeft || left + thumb.offsetWidth > strip.scrollLeft + strip.clientWidth) {
      strip.scrollTo({ left: left - strip.clientWidth / 2 + thumb.offsetWidth / 2, behavior: "smooth" });
    }
  }, [index]);

  if (count === 0) {
    return (
      <div className="relative -mx-5 aspect-square overflow-hidden bg-graphite-800 sm:mx-0 sm:rounded-md">
        <VehiclePhotoPlaceholder label="Fotos próximamente" />
      </div>
    );
  }

  const current = images[index];

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === "ArrowRight") {
      e.preventDefault();
      go(1);
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      go(-1);
    }
  };
  const onPointerDown = (e: PointerEvent) => {
    pointerStart.current = e.clientX;
  };
  const onPointerUp = (e: PointerEvent) => {
    if (pointerStart.current === null) return;
    const dx = e.clientX - pointerStart.current;
    pointerStart.current = null;
    if (Math.abs(dx) > SWIPE_THRESHOLD) go(dx < 0 ? 1 : -1);
  };

  const navButton =
    "absolute top-1/2 grid size-11 -translate-y-1/2 place-items-center rounded-full bg-ink/70 text-chalk backdrop-blur-sm transition-colors hover:bg-brand-red";

  return (
    <div>
      <div
        role="region"
        aria-roledescription="galería"
        aria-label={`Fotos de ${title}`}
        tabIndex={0}
        onKeyDown={onKeyDown}
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        className="group relative -mx-5 aspect-square touch-pan-y overflow-hidden bg-graphite-800 select-none sm:mx-0 sm:rounded-md"
      >
        <Image
          key={current.src}
          src={current.src}
          alt={`${current.alt} – foto ${index + 1} de ${count}`}
          fill
          sizes="(min-width: 1280px) 760px, (min-width: 1024px) 60vw, 100vw"
          preload={index === 0}
          fetchPriority={index === 0 ? "high" : undefined}
          className="object-cover"
        />
        {count > 1 ? (
          <>
            <button type="button" onClick={() => go(-1)} className={`${navButton} left-3`} aria-label="Foto anterior">
              <ArrowRightIcon className="rotate-180" />
            </button>
            <button type="button" onClick={() => go(1)} className={`${navButton} right-3`} aria-label="Foto siguiente">
              <ArrowRightIcon />
            </button>
          </>
        ) : null}
        <div className="absolute right-3 bottom-3 flex items-center gap-2">
          <span className="rounded-sm bg-ink/75 px-2.5 py-1 text-xs font-semibold tabular-nums backdrop-blur-sm" aria-live="polite">
            {index + 1} / {count}
          </span>
          <button
            type="button"
            onClick={() => dialogRef.current?.showModal()}
            className="rounded-sm bg-ink/75 px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.12em] backdrop-blur-sm hover:bg-brand-red"
          >
            Ampliar
          </button>
        </div>
      </div>

      {count > 1 ? (
        <ul ref={stripRef} className="scroll-row mt-2.5 flex snap-x gap-2 overflow-x-auto" aria-label="Miniaturas">
          {images.map((img, i) => (
            <li key={img.src} className="w-16 shrink-0 snap-start sm:w-20">
              <button
                type="button"
                onClick={() => setIndex(i)}
                aria-label={`Ver foto ${i + 1}`}
                aria-current={i === index ? "true" : undefined}
                className={`relative block aspect-square w-full overflow-hidden rounded-sm transition-opacity after:absolute after:inset-0 after:rounded-sm after:border-2 ${
                  i === index ? "after:border-brand-yellow" : "opacity-50 after:border-transparent hover:opacity-100"
                }`}
              >
                {/* Carga inmediata: son pocas y pequeñas; con carga diferida quedaban celdas vacías. */}
                <Image src={img.src} alt="" fill sizes="80px" loading="eager" className="object-cover" />
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      {/* Vista ampliada: <dialog> nativo (Escape y foco gestionados por el navegador). */}
      <dialog
        ref={dialogRef}
        aria-label={`Fotos de ${title}, vista ampliada`}
        onKeyDown={onKeyDown}
        className="m-0 h-full max-h-none w-full max-w-none bg-ink/97 p-0 text-chalk backdrop:bg-ink/80"
      >
        <div className="relative flex h-full flex-col">
          <div className="flex items-center justify-between px-4 py-3">
            <p className="text-sm tabular-nums text-mist">
              {index + 1} / {count}
            </p>
            <button
              type="button"
              onClick={() => dialogRef.current?.close()}
              className="grid size-11 place-items-center rounded-sm hover:bg-white/10"
              aria-label="Cerrar vista ampliada"
            >
              <CloseIcon width={24} height={24} />
            </button>
          </div>
          <div className="relative flex-1" onPointerDown={onPointerDown} onPointerUp={onPointerUp}>
            <Image src={current.src} alt={`${current.alt} – foto ${index + 1} de ${count}`} fill sizes="100vw" className="object-contain" />
            {count > 1 ? (
              <>
                <button type="button" onClick={() => go(-1)} className={`${navButton} left-4`} aria-label="Foto anterior">
                  <ArrowRightIcon className="rotate-180" />
                </button>
                <button type="button" onClick={() => go(1)} className={`${navButton} right-4`} aria-label="Foto siguiente">
                  <ArrowRightIcon />
                </button>
              </>
            ) : null}
          </div>
        </div>
      </dialog>
    </div>
  );
}
