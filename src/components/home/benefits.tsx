import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import { Container } from "@/components/layout/container";
import { buttonClasses } from "@/components/ui/button-link";
import { ArrowRightIcon, DocumentIcon, PercentIcon, SwapIcon, WhatsAppIcon } from "@/components/ui/icons";
import { SectionHeading } from "@/components/ui/section-heading";
import { whatsappUrl } from "@/lib/whatsapp";

// BORRADOR: beneficios redactados para la maqueta, pendientes de validación comercial.
const BENEFITS: { icon: ReactNode; title: string; text: string; cta: string; href: string; external?: boolean }[] = [
  {
    icon: <WhatsAppIcon width={24} height={24} />,
    title: "Atención directa",
    text: "Consulta por cualquier vehículo y conversa directo con nuestro equipo por WhatsApp.",
    cta: "Escríbenos",
    href: whatsappUrl(),
    external: true,
  },
  {
    icon: <SwapIcon width={24} height={24} />,
    title: "Tu auto en parte de pago",
    text: "Evaluamos tu vehículo actual para que lo uses como parte del pago de tu próximo auto.",
    cta: "Cotiza tu auto",
    href: "/vende-tu-auto",
  },
  {
    icon: <PercentIcon width={24} height={24} />,
    title: "Financiamiento",
    text: "Te orientamos con alternativas de crédito automotriz según tu perfil.",
    cta: "Ver financieras",
    href: "/financiamiento",
  },
  {
    icon: <DocumentIcon width={24} height={24} />,
    title: "Trámites acompañados",
    text: "Te guiamos en la documentación y transferencia para que compres con tranquilidad.",
    cta: "Consultar",
    href: "/contacto",
  },
];

export function Benefits() {
  return (
    <section aria-labelledby="benefits-title" className="relative overflow-hidden border-y border-white/8 bg-graphite-950 py-20 sm:py-28">
      {/* Franjas de marca de fondo, puramente decorativas. */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 -right-24 h-[140%] w-64 -skew-x-[20deg] bg-[linear-gradient(90deg,transparent_0_30%,rgba(255,240,0,0.06)_30%_62%,rgba(200,32,44,0.09)_62%_100%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-40 -left-40 size-[36rem] rounded-full bg-[radial-gradient(closest-side,rgba(255,240,0,0.05),transparent)]"
      />
      <Container className="relative">
        <SectionHeading
          id="benefits-title"
          eyebrow="Por qué AutoDealer"
          title={
            <>
              Comprar tu auto, <span className="text-brand-yellow">sin vueltas</span>
            </>
          }
          aside={
            <a href={whatsappUrl()} target="_blank" rel="noopener noreferrer" className={buttonClasses("outline", "lg", "whitespace-nowrap")}>
              <WhatsAppIcon /> Hablar con un asesor
            </a>
          }
        />
        <ul className="mt-12 grid gap-px overflow-hidden rounded-md border border-white/8 bg-white/8 sm:grid-cols-2 lg:grid-cols-4">
          {BENEFITS.map((b, i) => {
            const linkProps = b.external ? { target: "_blank", rel: "noopener noreferrer" } : {};
            return (
              <li
                key={b.title}
                className="benefit group relative isolate flex flex-col overflow-hidden bg-graphite-950 p-7 transition-colors duration-500 hover:bg-graphite-900 sm:p-8 lg:min-h-[22rem]"
                style={{ "--i": i } as CSSProperties}
              >
                {/* Franja de marca que se dibuja al pasar el mouse. */}
                <span
                  aria-hidden
                  className="absolute inset-x-0 top-0 h-[3px] origin-left scale-x-0 bg-[linear-gradient(90deg,var(--color-brand-yellow)_0_60%,var(--color-brand-red)_60%_100%)] transition-transform duration-500 ease-out group-hover:scale-x-100"
                />
                <span
                  aria-hidden
                  className="absolute -top-24 -left-24 -z-10 size-64 rounded-full bg-[radial-gradient(closest-side,rgba(255,240,0,0.09),transparent)] opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                />
                {/* Número grande calado, de fondo. */}
                <span
                  aria-hidden
                  className="absolute -right-2 -bottom-6 -z-10 font-display text-[8.5rem] leading-none font-extrabold italic text-transparent transition-all duration-500 [-webkit-text-stroke:1.5px_rgba(255,255,255,0.07)] group-hover:-translate-y-1 group-hover:[-webkit-text-stroke:1.5px_rgba(255,240,0,0.22)]"
                >
                  0{i + 1}
                </span>

                <div>
                  <span className="inline-grid size-14 -skew-x-[12deg] place-items-center rounded-sm bg-brand-yellow/10 text-brand-yellow ring-1 ring-brand-yellow/25 transition-colors duration-300 group-hover:bg-brand-yellow group-hover:text-ink">
                    <span className="skew-x-[12deg]">{b.icon}</span>
                  </span>
                </div>
                <h3 className="mt-8 font-display text-2xl leading-tight font-bold uppercase italic tracking-tight">{b.title}</h3>
                <p className="mt-3 max-w-xs text-[0.95rem] leading-relaxed text-mist">{b.text}</p>
                <Link
                  href={b.href}
                  {...linkProps}
                  className="mt-auto inline-flex items-center gap-2 pt-8 text-sm font-semibold uppercase tracking-[0.12em] text-chalk transition-colors after:absolute after:inset-0 group-hover:text-brand-yellow"
                >
                  {b.cta} <ArrowRightIcon width={16} height={16} className="transition-transform duration-300 group-hover:translate-x-1" />
                </Link>
              </li>
            );
          })}
        </ul>
      </Container>
    </section>
  );
}
