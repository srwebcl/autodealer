import type { Metadata } from "next";
import { Benefits } from "@/components/home/benefits";
import { FeaturedVehicles } from "@/components/home/featured-vehicles";
import { GoogleReviews } from "@/components/home/google-reviews";
import { Hero } from "@/components/home/hero";
import { SellBand } from "@/components/home/sell-band";
import { VisitUs } from "@/components/home/visit-us";
import { JsonLd } from "@/components/seo/json-ld";
import { websiteJsonLd } from "@/lib/seo/business";
import { getFeaturedVehicles } from "@/server/vehicles/queries";

export const metadata: Metadata = {
  title: { absolute: "AutoDealer | Automotora y autos usados en La Serena" },
  description:
    "Automotora en La Serena: autos usados con fotos, precio y kilometraje. Financiamiento, seguro y consignación. Av. Balmaceda 1595. Cotiza por WhatsApp.",
  alternates: { canonical: "/" },
};

export default async function HomePage() {
  // Consulta cacheada ("use cache"): la portada sigue siendo estática y se invalida con la etiqueta "vehicles".
  const featured = await getFeaturedVehicles(6);
  return (
    <>
      <JsonLd data={websiteJsonLd()} />
      <Hero />
      {featured.length > 0 ? <FeaturedVehicles vehicles={featured} /> : null}
      <GoogleReviews />
      <Benefits />
      <SellBand />
      <VisitUs />
    </>
  );
}
