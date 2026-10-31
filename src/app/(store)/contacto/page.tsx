import type { Metadata } from "next";
import { LeadForm } from "@/components/forms/lead-form";
import { SubHeading } from "@/components/forms/lead-page";
import { VisitUs } from "@/components/home/visit-us";
import { Container } from "@/components/layout/container";
import { PageHero } from "@/components/layout/page-hero";
import { buttonClasses } from "@/components/ui/button-link";
import { PhoneIcon, WhatsAppIcon } from "@/components/ui/icons";
import { siteConfig } from "@/config/site";
import { whatsappUrl } from "@/lib/whatsapp";

export const metadata: Metadata = {
  title: "Contacto",
  description: "Dirección, teléfono, email y horario de AutoDealer en La Serena.",
};

export default function ContactPage() {
  return (
    <>
      <PageHero eyebrow="Contacto" title="Hablemos">
        <p>Escríbenos por WhatsApp, llámanos, déjanos un mensaje o visítanos en La Serena.</p>
      </PageHero>

      <Container className="py-14 sm:py-20">
        <div className="grid items-start gap-x-16 gap-y-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,32rem)]">
          <section aria-labelledby="direct-title" className="min-w-0 lg:sticky lg:top-26">
            <SubHeading>
              <span id="direct-title">Respuesta inmediata</span>
            </SubHeading>
            <p className="mt-3 max-w-md leading-relaxed text-chalk/80">WhatsApp y teléfono son la forma más rápida de hablar con nosotros, dentro del horario de atención.</p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <a href={whatsappUrl()} target="_blank" rel="noopener noreferrer" className={buttonClasses("whatsapp", "lg", "whitespace-nowrap")}>
                <WhatsAppIcon className="shrink-0" /> Escribir por WhatsApp
              </a>
              <a href={`tel:${siteConfig.phoneE164}`} className={buttonClasses("outline", "lg", "whitespace-nowrap")}>
                <PhoneIcon className="shrink-0" width={18} height={18} /> {siteConfig.phoneDisplay}
              </a>
            </div>
          </section>
          <div id="formulario" className="min-w-0 scroll-mt-24 rounded-md border border-white/10 bg-graphite-900 p-6 sm:p-8">
            <SubHeading>Déjanos un mensaje</SubHeading>
            <p className="mt-2 mb-6 text-sm leading-relaxed text-mist">Te respondemos por teléfono, WhatsApp o email.</p>
            <LeadForm form="contacto" />
          </div>
        </div>
      </Container>
      <VisitUs />
    </>
  );
}
