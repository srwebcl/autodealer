import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { LeadForm } from "@/components/forms/lead-form";
import { LeadPageLayout, PartnerLogo, Steps, SubHeading } from "@/components/forms/lead-page";
import { Container } from "@/components/layout/container";
import { PageHero } from "@/components/layout/page-hero";
import { ArrowRightIcon } from "@/components/ui/icons";
import { financingPartners } from "@/config/partners";

export const metadata: Metadata = {
  title: "Financiamiento automotriz",
  description: "Financia tu auto en AutoDealer, La Serena. Trabajamos con Autofin, Global y Unidad Crédito, entre otras financieras.",
  alternates: { canonical: "/financiamiento" },
};

/** Prellenado desde la ficha de un vehículo: /financiamiento?vehiculo=… */
async function FinancingForm({ searchParams }: Pick<PageProps<"/financiamiento">, "searchParams">) {
  const raw = (await searchParams).vehiculo;
  const vehicle = (Array.isArray(raw) ? raw[0] : raw)?.trim().slice(0, 120);
  return <LeadForm form="financiamiento" defaultVehicle={vehicle || undefined} />;
}

export default function FinancingPage({ searchParams }: PageProps<"/financiamiento">) {
  return (
    <>
      <PageHero
        eyebrow="Financiamiento"
        title={
          <>
            Financia tu <span className="text-brand-yellow">próximo auto</span>
          </>
        }
      >
        <p>Trabajamos con las principales financieras automotrices. Cuéntanos qué auto te interesa y te ayudamos a encontrar una alternativa de crédito.</p>
      </PageHero>

      <Container className="py-14 sm:py-20">
        <LeadPageLayout
          intro={
            <section aria-labelledby="partners-title">
              <SubHeading>
                <span id="partners-title">Financieras con las que trabajamos</span>
              </SubHeading>
              <ul className="mt-6 grid grid-cols-3 gap-2 sm:gap-3">
                {financingPartners.map((p) => (
                  <li key={p.name}>
                    <PartnerLogo {...p} />
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-sm text-mist">Entre otras financieras.</p>
            </section>
          }
          form={
            <>
              <SubHeading>Solicita tu financiamiento</SubHeading>
              <p className="mt-2 mb-6 text-sm leading-relaxed text-mist">Completa tus datos y te contactamos con las alternativas disponibles.</p>
              <Suspense fallback={<LeadForm form="financiamiento" />}>
                <FinancingForm searchParams={searchParams} />
              </Suspense>
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
                    "Elige tu auto en nuestro catálogo o cuéntanos qué tipo de vehículo buscas.",
                    "Completa el formulario con tus datos y el pie que tienes disponible.",
                    "Te contactamos con las alternativas de crédito de nuestras financieras.",
                  ]}
                />
              </section>
              <div className="border-l-2 border-brand-yellow pl-5">
                <p className="font-semibold text-chalk">¿Tienes un auto?</p>
                <p className="mt-1 leading-relaxed text-chalk/80">Lo recibimos en parte de pago.</p>
                <Link href="/vende-tu-auto" className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-chalk hover:text-brand-yellow">
                  Vende o deja tu auto <ArrowRightIcon width={15} height={15} />
                </Link>
              </div>
              <p className="text-xs leading-relaxed text-mist">La aprobación del crédito, la tasa, el plazo y el pie dependen de la evaluación de cada financiera.</p>
            </div>
          }
        />
      </Container>
    </>
  );
}
