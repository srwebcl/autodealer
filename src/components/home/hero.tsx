import { type CSSProperties, type ReactNode, Suspense } from "react";
import { Container } from "@/components/layout/container";
import { ButtonLink, buttonClasses } from "@/components/ui/button-link";
import { ArrowRightIcon, PinIcon, WhatsAppIcon } from "@/components/ui/icons";
import { siteConfig } from "@/config/site";
import { whatsappUrl } from "@/lib/whatsapp";
import bmwM4Hangar from "../../../public/images/hero/bmw-m4-hangar.jpg";
import bmwM4Mate from "../../../public/images/hero/bmw-m4-mate.jpg";
import ferrari458 from "../../../public/images/hero/ferrari-458.jpg";
import ferrari488 from "../../../public/images/hero/ferrari-488.jpg";
import mercedesCoupe from "../../../public/images/hero/mercedes-coupe.jpg";
import { type HeroSlide, HeroSlideshow } from "./hero-slideshow";
import { getSearchIndex } from "@/server/vehicles/queries";
import { SmartSearch } from "./smart-search";

// Fotos de Unsplash (licencia Unsplash: uso comercial gratuito). Créditos en el README.
const SLIDES: HeroSlide[] = [
  { src: bmwM4Mate, mobilePosition: "object-[78%_center]" },
  { src: ferrari458, mobilePosition: "object-center" },
  { src: mercedesCoupe, mobilePosition: "object-center" },
  { src: bmwM4Hangar, mobilePosition: "object-[45%_center]", desktopPosition: "md:object-[center_85%]" },
  { src: ferrari488, mobilePosition: "object-center" },
];

const delay = (s: number) => ({ "--d": `${s}s` }) as CSSProperties;

/** Palabra que sube desde una máscara (la animación vive en globals.css). */
function Word({ at, children }: { at: number; children: ReactNode }) {
  return (
    <span className="hero-word">
      <span style={delay(at)}>{children}</span>
    </span>
  );
}

/** El índice sale de la caché del inventario; mientras carga, el buscador funciona como formulario. */
async function HeroSearch() {
  return <SmartSearch items={await getSearchIndex()} />;
}

export function Hero() {
  return (
    <section
      aria-labelledby="hero-title"
      className="relative isolate z-10 flex min-h-[100svh] flex-col overflow-x-clip bg-ink"
    >
      <HeroSlideshow slides={SLIDES} />
      {/* Velos para legibilidad: lateral en escritorio, inferior en móvil. */}
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-[linear-gradient(0deg,var(--color-ink)_0%,var(--color-ink)_42%,rgba(8,9,11,0.55)_58%,rgba(8,9,11,0.1)_78%,rgba(8,9,11,0.55)_100%)] md:bg-[linear-gradient(90deg,rgba(8,9,11,0.95)_0%,rgba(8,9,11,0.78)_38%,rgba(8,9,11,0.15)_70%,rgba(8,9,11,0.35)_100%)]"
      />
      <div
        aria-hidden
        className="absolute inset-x-0 bottom-0 -z-10 hidden h-48 bg-gradient-to-t from-ink to-transparent md:block"
      />
      {/* Barrido de franjas de marca al cargar (una sola pasada). */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="hero-sweep">
          <span className="w-24 bg-brand-yellow/85" />
          <span className="w-10 bg-brand-red/85" />
          <span className="w-3 bg-brand-yellow/70" />
        </div>
      </div>

      <Container className="flex flex-1 flex-col justify-end pt-[40svh] pb-10 md:justify-center md:pt-36 md:pb-14">
        <div className="max-w-2xl">
          <p className="eyebrow flex items-center gap-3">
            <span className="brand-stripe hero-stripe-in" style={delay(0.35)} aria-hidden />
            <span className="hero-rise" style={delay(0.45)}>
              Automotora en {siteConfig.city}
            </span>
          </p>
          <h1
            id="hero-title"
            className="mt-6 font-display text-[clamp(3rem,9vw,6.5rem)] leading-[0.88] font-extrabold uppercase italic tracking-[-0.01em] text-balance"
          >
            <Word at={0.55}>Tu</Word> <Word at={0.65}>próximo</Word> <Word at={0.75}>auto</Word>{" "}
            <span className="text-brand-yellow">
              <Word at={0.92}>
                <span className="hero-shine" style={delay(1.9)}>
                  te
                </span>
              </Word>{" "}
              <Word at={1.02}>
                <span className="hero-shine" style={delay(1.95)}>
                  espera.
                </span>
              </Word>
            </span>
          </h1>
          <p className="hero-rise mt-6 max-w-lg text-lg leading-relaxed text-chalk/80" style={delay(1.15)}>
            Revisa los vehículos disponibles, compara y cotiza directo por WhatsApp. Te esperamos en Avenida Balmaceda,
            La Serena.
          </p>
          <div className="hero-rise mt-8 flex flex-col gap-3 sm:flex-row" style={delay(1.3)}>
            <ButtonLink href="/vehiculos" size="lg">
              Ver vehículos <ArrowRightIcon />
            </ButtonLink>
            <a
              href={whatsappUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className={buttonClasses("outline", "lg", "backdrop-blur-sm")}
            >
              <WhatsAppIcon /> Cotizar por WhatsApp
            </a>
          </div>
          <p className="hero-rise mt-6 flex items-center gap-2 text-sm text-mist" style={delay(1.45)}>
            <PinIcon width={16} height={16} /> {siteConfig.address}
          </p>
        </div>
      </Container>

      <Container className="relative pb-10 md:pb-16">
        <div className="hero-rise relative z-20" style={delay(1.6)}>
          <Suspense fallback={<SmartSearch items={null} />}>
            <HeroSearch />
          </Suspense>
        </div>
      </Container>
    </section>
  );
}
