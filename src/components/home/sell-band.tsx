import Image from "next/image";
import { Container } from "@/components/layout/container";
import { ButtonLink, buttonClasses } from "@/components/ui/button-link";
import { ArrowRightIcon, KeyIcon, SwapIcon, WhatsAppIcon } from "@/components/ui/icons";
import { whatsappUrl } from "@/lib/whatsapp";
import carPhoto from "../../../public/images/hero/bmw-m4-hangar.jpg";

const MODES = [
  { label: "Consignación", Icon: KeyIcon },
  { label: "Parte de pago", Icon: SwapIcon },
];

function CarPhoto({ className, sizes }: { className: string; sizes: string }) {
  return (
    <Image
      src={carPhoto}
      alt=""
      fill
      sizes={sizes}
      placeholder="blur"
      className={`object-cover transition-transform duration-[1.2s] ease-out group-hover:scale-105 ${className}`}
    />
  );
}

export function SellBand() {
  return (
    <section aria-labelledby="sell-title" className="py-20 sm:py-28">
      <Container>
        <div className="group relative isolate overflow-hidden rounded-md bg-brand-red px-6 pt-12 shadow-[0_40px_100px_-45px_rgba(200,32,44,0.75)] sm:px-12 md:py-16 lg:px-16 lg:py-20">
          {/* Escritorio: ventana diagonal con el auto, franja amarilla y sombra a la izquierda. */}
          <div aria-hidden className="absolute inset-y-0 -right-10 -z-10 hidden w-[60%] -skew-x-[20deg] bg-black/18 md:block" />
          <div
            aria-hidden
            className="absolute inset-y-0 -right-48 -z-10 hidden w-[66%] -skew-x-[20deg] overflow-hidden border-l-[1.6rem] border-brand-yellow md:block lg:border-l-[2rem]"
          >
            <div className="absolute inset-y-0 -right-40 -left-40 skew-x-[20deg]">
              <CarPhoto sizes="(min-width: 768px) 55vw, 1px" className="object-[22%_78%]" />
            </div>
            <div className="absolute inset-0 bg-linear-to-r from-black/55 via-black/10 to-black/35" />
          </div>

          <div className="relative max-w-xl md:max-w-[min(36rem,52%)]">
            <p className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.22em] text-white/85">
              <span aria-hidden className="h-[3px] w-8 bg-ink" />
              Vende tu auto
            </p>
            <h2
              id="sell-title"
              className="mt-4 font-display text-[2.6rem] leading-[0.92] font-extrabold uppercase italic tracking-tight text-balance drop-shadow-[0_4px_18px_rgba(0,0,0,0.25)] sm:text-6xl md:text-5xl lg:text-6xl xl:text-7xl"
            >
              ¿Quieres vender o cambiar <span className="text-brand-yellow">tu auto?</span>
            </h2>
            <p className="mt-5 max-w-md text-base leading-relaxed text-white/90 sm:text-lg">
              Cuéntanos qué vehículo tienes y te contactamos para evaluarlo, en consignación o como parte de pago.
            </p>
            <ul className="mt-6 flex flex-wrap gap-2">
              {MODES.map(({ label, Icon }) => (
                <li
                  key={label}
                  className="inline-flex items-center gap-2 rounded-full bg-black/20 px-3.5 py-2 text-[13px] font-semibold sm:px-4 sm:text-sm text-white ring-1 ring-white/25"
                >
                  <Icon width={16} height={16} className="text-brand-yellow" /> {label}
                </li>
              ))}
            </ul>
            <div className="mt-9 flex flex-col gap-3 *:whitespace-nowrap sm:flex-row md:flex-col md:items-start xl:flex-row">
              <ButtonLink href="/vende-tu-auto#formulario" size="lg" className="bg-ink! text-chalk shadow-[0_12px_30px_-12px_rgba(0,0,0,0.8)] hover:bg-graphite-800!">
                Cotiza tu auto <ArrowRightIcon className="transition-transform group-hover:translate-x-1" />
              </ButtonLink>
              <a
                href={whatsappUrl("Hola AutoDealer, quiero vender mi auto.")}
                target="_blank"
                rel="noopener noreferrer"
                className={buttonClasses("outline", "lg", "border-white/60 hover:bg-white/10")}
              >
                <WhatsAppIcon /> Enviar datos
              </a>
            </div>
          </div>

          {/* Móvil: el auto bajo el texto, con el mismo corte diagonal y la franja amarilla. */}
          <div aria-hidden className="relative -mx-6 mt-12 h-52 sm:-mx-12 md:hidden">
            <div className="absolute inset-0 bg-brand-yellow [clip-path:polygon(0_26%,100%_0,100%_100%,0_100%)]" />
            <div className="absolute inset-0 overflow-hidden [clip-path:polygon(0_36%,100%_10%,100%_100%,0_100%)]">
              <div className="absolute inset-0 origin-[28%_88%] scale-[1.45]">
                <CarPhoto sizes="(max-width: 767px) 100vw, 1px" className="object-[28%_88%]" />
              </div>
              <div className="absolute inset-0 bg-linear-to-b from-black/30 to-transparent" />
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
