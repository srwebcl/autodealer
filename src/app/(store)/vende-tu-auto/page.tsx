import type { Metadata } from "next";
import { ComingSoon } from "@/components/layout/coming-soon";
import { PageHero } from "@/components/layout/page-hero";

export const metadata: Metadata = {
  title: "Vende tu auto",
  robots: { index: false, follow: true }, // texto provisional
};

export default function SellYourCarPage() {
  return (
    <>
      <PageHero eyebrow="Vende tu auto" title="Vende o cambia tu auto" />
      <ComingSoon whatsappMessage="Hola AutoDealer, quiero vender mi auto. Marca, modelo, año y kilometraje:">
        <p>
          Recibimos vehículos en consignación y como parte de pago. Envíanos marca, modelo, año, kilometraje y algunas fotos,
          y te contactamos para coordinar una evaluación.
        </p>
        <p className="text-mist">Las condiciones de consignación y parte de pago se publicarán aquí una vez confirmadas.</p>
      </ComingSoon>
    </>
  );
}
