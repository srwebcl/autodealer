import Image from "next/image";
import type { ReactNode } from "react";

/** Logo de socio sobre ficha clara (los logos oficiales son para fondo blanco). */
export function PartnerLogo({ name, logo, width, height, large = false }: { name: string; logo: string; width: number; height: number; large?: boolean }) {
  return (
    <div className={`relative grid place-items-center rounded-md bg-white ${large ? "h-28 px-8" : "h-16 px-2.5 sm:h-24 sm:px-4"}`}>
      <Image src={logo} alt={name} width={width} height={height} unoptimized={logo.endsWith(".svg")} className={`h-auto w-auto object-contain ${large ? "max-h-14" : "max-h-10 sm:max-h-14"}`} />
    </div>
  );
}

export function SubHeading({ children }: { children: ReactNode }) {
  return <h2 className="font-display text-2xl font-extrabold uppercase italic tracking-tight sm:text-3xl">{children}</h2>;
}

/** Pasos numerados con líneas finas (sin tarjetas). */
export function Steps({ steps }: { steps: string[] }) {
  return (
    <ol className="mt-5 border-b border-white/8">
      {steps.map((s, i) => (
        <li key={s} className="flex gap-4 border-t border-white/8 py-4">
          <span className="font-display text-2xl leading-none font-bold text-brand-yellow italic">{i + 1}</span>
          <span className="leading-relaxed text-chalk/85">{s}</span>
        </li>
      ))}
    </ol>
  );
}

/**
 * Página con información y formulario. Móvil: info → formulario → pasos.
 * Escritorio: info y pasos a la izquierda, formulario fijo a la derecha.
 */
export function LeadPageLayout({ intro, form, after }: { intro: ReactNode; form: ReactNode; after: ReactNode }) {
  return (
    <div className="grid items-start gap-x-16 gap-y-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,32rem)] lg:grid-rows-[auto_1fr]">
      <div className="min-w-0 lg:col-start-1 lg:row-start-1">{intro}</div>
      <div id="formulario" className="min-w-0 scroll-mt-24 rounded-md border border-white/10 bg-graphite-900 p-6 sm:p-8 lg:sticky lg:top-24 lg:col-start-2 lg:row-span-2 lg:row-start-1">
        {form}
      </div>
      <div className="min-w-0 lg:col-start-1 lg:row-start-2">{after}</div>
    </div>
  );
}
