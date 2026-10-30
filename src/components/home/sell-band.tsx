import { Container } from "@/components/layout/container";
import { ButtonLink, buttonClasses } from "@/components/ui/button-link";
import { DraftBadge } from "@/components/ui/draft-badge";
import { ArrowRightIcon, WhatsAppIcon } from "@/components/ui/icons";
import { whatsappUrl } from "@/lib/whatsapp";

export function SellBand() {
  return (
    <section aria-labelledby="sell-title" className="py-20 sm:py-28">
      <Container>
        <div className="relative isolate overflow-hidden rounded-md bg-brand-red px-6 py-14 sm:px-12 lg:px-16 lg:py-16">
          <div
            aria-hidden
            className="absolute inset-y-0 -right-10 -z-10 w-[55%] -skew-x-[20deg] bg-[linear-gradient(90deg,rgba(0,0,0,0.18)_0_40%,var(--color-brand-yellow)_40%_52%,rgba(0,0,0,0.28)_52%_100%)] max-md:opacity-40"
          />
          <div className="max-w-xl">
            <DraftBadge />
            <h2
              id="sell-title"
              className="mt-4 font-display text-4xl leading-[0.95] font-extrabold uppercase italic tracking-tight text-balance sm:text-5xl"
            >
              ¿Quieres vender o cambiar tu auto?
            </h2>
            <p className="mt-4 text-base leading-relaxed text-white/90">
              Cuéntanos qué vehículo tienes y te contactamos para evaluarlo, en consignación o como parte de pago.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <ButtonLink href="/vende-tu-auto" size="lg" className="bg-ink! text-chalk hover:bg-graphite-800!">
                Cómo funciona <ArrowRightIcon />
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
        </div>
      </Container>
    </section>
  );
}
