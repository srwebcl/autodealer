import type { Metadata } from "next";
import Link from "next/link";
import { LeadForm } from "@/components/forms/lead-form";
import { LeadPageLayout, Steps, SubHeading } from "@/components/forms/lead-page";
import { Container } from "@/components/layout/container";
import { PageHero } from "@/components/layout/page-hero";
import { ArrowRightIcon } from "@/components/ui/icons";

export const metadata: Metadata = {
  title: "Vende tu auto",
  description: "Deja tu auto en consignación o entrégalo en parte de pago en AutoDealer, La Serena.",
  robots: { index: false, follow: true }, // sin indexar hasta aprobar su contenido
};

export default function SellYourCarPage() {
  return (
    <>
      <PageHero
        eyebrow="Vende tu auto"
        title={
          <>
            Vende o cambia <span className="text-brand-yellow">tu auto</span>
          </>
        }
      >
        <p>Recibimos vehículos en consignación y como parte de pago. Cuéntanos de tu auto y te contactamos para coordinar una evaluación.</p>
      </PageHero>

      <Container className="py-14 sm:py-20">
        <LeadPageLayout
          intro={
            <section aria-labelledby="modes-title">
              <SubHeading>
                <span id="modes-title">Dos formas de hacerlo</span>
              </SubHeading>
              <dl className="mt-5 border-b border-white/8">
                <div className="border-t border-white/8 py-4">
                  <dt className="font-semibold text-chalk">Consignación</dt>
                  <dd className="mt-1 leading-relaxed text-chalk/80">Dejas tu auto con nosotros y lo vendemos por ti.</dd>
                </div>
                <div className="border-t border-white/8 py-4">
                  <dt className="font-semibold text-chalk">Parte de pago</dt>
                  <dd className="mt-1 leading-relaxed text-chalk/80">
                    Lo entregas como parte del pago de un auto de nuestro{" "}
                    <Link href="/vehiculos" className="underline decoration-white/30 underline-offset-4 hover:text-brand-yellow">
                      catálogo
                    </Link>
                    .
                  </dd>
                </div>
              </dl>
            </section>
          }
          form={
            <>
              <SubHeading>Cuéntanos de tu auto</SubHeading>
              <p className="mt-2 mb-6 text-sm leading-relaxed text-mist">Con estos datos preparamos la evaluación y te contactamos.</p>
              <LeadForm form="vende" />
            </>
          }
          after={
            <div className="space-y-10">
              <section aria-labelledby="steps-title">
                <SubHeading>
                  <span id="steps-title">Cómo funciona</span>
                </SubHeading>
                <Steps
                  steps={[
                    "Completa el formulario con marca, modelo, año y kilometraje.",
                    "Envíanos algunas fotos del auto por WhatsApp.",
                    "Te contactamos para coordinar la evaluación.",
                  ]}
                />
              </section>
              <div className="border-l-2 border-brand-yellow pl-5">
                <p className="font-semibold text-chalk">¿Necesitas financiar la diferencia?</p>
                <Link href="/financiamiento" className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-chalk hover:text-brand-yellow">
                  Ver financiamiento <ArrowRightIcon width={15} height={15} />
                </Link>
              </div>
            </div>
          }
        />
      </Container>
    </>
  );
}
