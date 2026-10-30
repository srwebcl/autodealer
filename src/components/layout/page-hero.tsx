import type { ReactNode } from "react";
import { Container } from "./container";

/** Cabecera compacta para páginas interiores. */
export function PageHero({ eyebrow, title, children }: { eyebrow: string; title: ReactNode; children?: ReactNode }) {
  return (
    <section className="relative overflow-hidden border-b border-white/8 bg-graphite-950 pt-36 pb-14 sm:pt-40 sm:pb-16">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-10 right-[8%] h-[150%] w-40 -skew-x-[20deg] bg-[linear-gradient(90deg,rgba(255,240,0,0.08)_0_50%,rgba(200,32,44,0.12)_50%_100%)]"
      />
      <Container className="relative">
        <p className="eyebrow flex items-center gap-3">
          <span className="brand-stripe" aria-hidden />
          {eyebrow}
        </p>
        <h1 className="mt-5 font-display text-5xl leading-[0.92] font-extrabold uppercase italic tracking-tight text-balance sm:text-6xl">
          {title}
        </h1>
        {children ? <div className="mt-5 max-w-2xl text-lg leading-relaxed text-chalk/80">{children}</div> : null}
      </Container>
    </section>
  );
}
