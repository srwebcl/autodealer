import type { ReactNode } from "react";
import { Container } from "@/components/layout/container";
import { DocumentIcon, PercentIcon, SwapIcon, WhatsAppIcon } from "@/components/ui/icons";
import { SectionHeading } from "@/components/ui/section-heading";

// BORRADOR: beneficios redactados para la maqueta, pendientes de validación comercial.
const BENEFITS: { icon: ReactNode; title: string; text: string }[] = [
  {
    icon: <WhatsAppIcon width={22} height={22} />,
    title: "Atención directa",
    text: "Consulta por cualquier vehículo y conversa directo con nuestro equipo por WhatsApp.",
  },
  {
    icon: <SwapIcon width={22} height={22} />,
    title: "Tu auto en parte de pago",
    text: "Evaluamos tu vehículo actual para que lo uses como parte del pago de tu próximo auto.",
  },
  {
    icon: <PercentIcon width={22} height={22} />,
    title: "Financiamiento",
    text: "Te orientamos con alternativas de crédito automotriz según tu perfil.",
  },
  {
    icon: <DocumentIcon width={22} height={22} />,
    title: "Trámites acompañados",
    text: "Te guiamos en la documentación y transferencia para que compres con tranquilidad.",
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
      <Container className="relative">
        <SectionHeading
          id="benefits-title"
          eyebrow="Por qué AutoDealer"
          title="Comprar tu auto, sin vueltas"
        />
        <ul className="mt-12 grid gap-px overflow-hidden rounded-md border border-white/8 bg-white/8 sm:grid-cols-2 lg:grid-cols-4">
          {BENEFITS.map((b, i) => (
            <li key={b.title} className="flex flex-col bg-graphite-950 p-7 transition-colors hover:bg-graphite-900">
              <div className="flex items-center justify-between">
                <span className="grid size-11 place-items-center rounded-sm bg-white/5 text-brand-yellow">{b.icon}</span>
                <span aria-hidden className="font-display text-sm font-bold italic text-white/25">
                  0{i + 1}
                </span>
              </div>
              <h3 className="mt-6 font-display text-xl font-bold uppercase italic tracking-tight">{b.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-mist">{b.text}</p>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
