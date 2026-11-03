import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { LeadForm } from "@/components/forms/lead-form";
import { LeadPageLayout, Steps, SubHeading } from "@/components/forms/lead-page";
import { Container } from "@/components/layout/container";
import { PageHero } from "@/components/layout/page-hero";
import { ConsignmentPoints } from "@/components/sell/consignment-points";
import { ArrowRightIcon } from "@/components/ui/icons";

export const metadata: Metadata = {
  title: "Vende tu auto",
  description: "Deja tu auto en consignación o entrégalo en parte de pago en AutoDealer, La Serena.",
  alternates: { canonical: "/vende-tu-auto" },
};

/** Bloque de cada opción: etiqueta pequeña, título y texto de entrada. */
function Option({ id, tag, title, lead, children }: { id: string; tag: string; title: string; lead: ReactNode; children?: ReactNode }) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="scroll-mt-24">
      <p className="eyebrow flex items-center gap-3">
        <span className="brand-stripe" aria-hidden />
        {tag}
      </p>
      <div className="mt-3">
        <SubHeading>
          <span id={`${id}-title`}>{title}</span>
        </SubHeading>
      </div>
      <p className="mt-3 max-w-xl text-lg leading-relaxed text-chalk/85">{lead}</p>
      {children ? <div className="mt-7">{children}</div> : null}
    </section>
  );
}

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
          stickyInfo={false}
          intro={
            <div className="space-y-14">
              <Option id="consignacion" tag="Opción principal" title="Consignación" lead="Dejas tu auto con nosotros y lo vendemos por ti.">
                <ConsignmentPoints />
              </Option>

              <Option
                id="parte-de-pago"
                tag="Alternativa"
                title="Parte de pago"
                lead={
                  <>
                    Lo entregas como parte del pago de un auto de nuestro{" "}
                    <Link href="/vehiculos" className="underline decoration-white/30 underline-offset-4 hover:text-brand-yellow">
                      catálogo
                    </Link>
                    .
                  </>
                }
              >
                <div className="border-l-2 border-brand-yellow pl-5">
                  <p className="font-semibold text-chalk">¿Necesitas financiar la diferencia?</p>
                  <Link href="/financiamiento" className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-chalk hover:text-brand-yellow">
                    Ver financiamiento <ArrowRightIcon width={15} height={15} />
                  </Link>
                </div>
              </Option>
            </div>
          }
          form={
            <>
              <SubHeading>Cuéntanos de tu auto</SubHeading>
              <p className="mt-2 mb-6 text-sm leading-relaxed text-mist">Con estos datos preparamos la evaluación y te contactamos.</p>
              <LeadForm form="vende" />
            </>
          }
          after={
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
          }
        />
      </Container>
    </>
  );
}
