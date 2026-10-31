import type { Metadata } from "next";
import { ComingSoon } from "@/components/layout/coming-soon";
import { PageHero } from "@/components/layout/page-hero";

export const metadata: Metadata = {
  title: "Financiamiento",
  robots: { index: false, follow: true }, // sin indexar hasta aprobar su contenido
};

export default function FinancingPage() {
  return (
    <>
      <PageHero eyebrow="Financiamiento" title="Financia tu próximo auto" />
      <ComingSoon whatsappMessage="Hola AutoDealer, quiero información sobre financiamiento.">
        <p>
          Te orientamos con alternativas de crédito automotriz para que elijas la cuota que mejor se adapte a ti. Escríbenos
          con el vehículo que te interesa y el pie que tienes disponible.
        </p>
        <p className="text-mist">Las condiciones de financiamiento se informarán aquí una vez confirmadas.</p>
      </ComingSoon>
    </>
  );
}
