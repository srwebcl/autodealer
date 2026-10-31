import type { Metadata } from "next";
import { LeadForm } from "@/components/forms/lead-form";
import { LeadPageLayout, PartnerLogo, Steps, SubHeading } from "@/components/forms/lead-page";
import { Container } from "@/components/layout/container";
import { PageHero } from "@/components/layout/page-hero";
import { insurancePartner } from "@/config/partners";

export const metadata: Metadata = {
  title: "Seguro automotriz",
  description: "Cotiza el seguro de tu auto con BCI Seguros a través de AutoDealer, La Serena. Convenio directo.",
  alternates: { canonical: "/seguros" },
};

export default function InsurancePage() {
  return (
    <>
      <PageHero
        eyebrow="Seguros"
        title={
          <>
            Asegura <span className="text-brand-yellow">tu auto</span>
          </>
        }
      >
        <p>Cotiza el seguro automotriz de tu auto con BCI Seguros, con quienes tenemos convenio directo.</p>
      </PageHero>

      <Container className="py-14 sm:py-20">
        <LeadPageLayout
          intro={
            <section aria-labelledby="partner-title">
              <SubHeading>
                <span id="partner-title">Convenio directo con BCI Seguros</span>
              </SubHeading>
              <div className="mt-6 max-w-md">
                <PartnerLogo {...insurancePartner} large />
              </div>
            </section>
          }
          form={
            <>
              <SubHeading>Cotiza tu seguro</SubHeading>
              <p className="mt-2 mb-6 text-sm leading-relaxed text-mist">Déjanos los datos de tu auto y te contactamos con la cotización.</p>
              <LeadForm form="seguro" />
            </>
          }
          after={
            <div className="space-y-10">
              <section aria-labelledby="steps-title">
                <SubHeading>
                  <span id="steps-title">Cómo funciona</span>
                </SubHeading>
                <Steps steps={["Completa el formulario con los datos de tu auto.", "Te contactamos con la cotización de BCI Seguros."]} />
              </section>
              <p className="text-xs leading-relaxed text-mist">Las coberturas, deducibles y el valor del seguro los define BCI Seguros según el vehículo y el perfil del asegurado.</p>
            </div>
          }
        />
      </Container>
    </>
  );
}
