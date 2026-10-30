import type { Metadata } from "next";
import { VisitUs } from "@/components/home/visit-us";
import { PageHero } from "@/components/layout/page-hero";

export const metadata: Metadata = {
  title: "Contacto",
  description: "Dirección, teléfono, email y horario de AutoDealer en La Serena.",
};

export default function ContactPage() {
  return (
    <>
      <PageHero eyebrow="Contacto" title="Hablemos">
        <p>Escríbenos por WhatsApp, llámanos o visítanos en La Serena.</p>
      </PageHero>
      <VisitUs />
    </>
  );
}
