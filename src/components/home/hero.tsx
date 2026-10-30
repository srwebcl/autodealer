import Image from "next/image";
import { Container } from "@/components/layout/container";
import { ButtonLink, buttonClasses } from "@/components/ui/button-link";
import { ArrowRightIcon, PinIcon, WhatsAppIcon } from "@/components/ui/icons";
import { siteConfig } from "@/config/site";
import { whatsappUrl } from "@/lib/whatsapp";
import heroImage from "../../../public/images/hero-tunel.jpg";
import { QuickSearch } from "./quick-search";

export function Hero() {
  return (
    <section
      aria-labelledby="hero-title"
      className="relative isolate flex min-h-[100svh] flex-col overflow-hidden bg-ink"
    >
      {/* Móvil: foto en la mitad superior. Escritorio: foto a sangre completa. */}
      <div aria-hidden className="absolute inset-x-0 top-0 -z-20 h-[58svh] md:inset-0 md:h-auto">
        <Image
          src={heroImage}
          alt=""
          fill
          preload
          fetchPriority="high"
          quality={80}
          placeholder="blur"
          sizes="100vw"
          className="object-cover object-[72%_center] md:object-center"
        />
        <div className="absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-ink to-transparent md:hidden" />
      </div>
      {/* Velos para legibilidad: lateral en escritorio, inferior en móvil. */}
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-[linear-gradient(0deg,var(--color-ink)_0%,var(--color-ink)_42%,rgba(8,9,11,0.55)_58%,rgba(8,9,11,0.1)_78%,rgba(8,9,11,0.55)_100%)] md:bg-[linear-gradient(90deg,rgba(8,9,11,0.95)_0%,rgba(8,9,11,0.78)_38%,rgba(8,9,11,0.15)_70%,rgba(8,9,11,0.35)_100%)]"
      />
      <div
        aria-hidden
        className="absolute inset-x-0 bottom-0 -z-10 hidden h-48 bg-gradient-to-t from-ink to-transparent md:block"
      />

      <Container className="flex flex-1 flex-col justify-end pt-[40svh] pb-10 md:justify-center md:pt-36 md:pb-14">
        <div className="max-w-2xl animate-rise">
          <p className="eyebrow flex items-center gap-3">
            <span className="brand-stripe" aria-hidden />
            Automotora en {siteConfig.city}
          </p>
          <h1
            id="hero-title"
            className="mt-6 font-display text-[clamp(3rem,9vw,6.5rem)] leading-[0.88] font-extrabold uppercase italic tracking-[-0.01em] text-balance"
          >
            Tu próximo auto <span className="text-brand-yellow">te espera.</span>
          </h1>
          <p className="mt-6 max-w-lg text-lg leading-relaxed text-chalk/80">
            Revisa los vehículos disponibles, compara y cotiza directo por WhatsApp. Te esperamos en Avenida Balmaceda,
            La Serena.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
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
          <p className="mt-6 flex items-center gap-2 text-sm text-mist">
            <PinIcon width={16} height={16} /> {siteConfig.address}
          </p>
        </div>
      </Container>

      <Container className="relative pb-10 md:pb-16">
        <QuickSearch />
      </Container>
    </section>
  );
}
