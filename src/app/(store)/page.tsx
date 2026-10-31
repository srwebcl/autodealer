import { Benefits } from "@/components/home/benefits";
import { FeaturedVehicles } from "@/components/home/featured-vehicles";
import { GoogleReviews } from "@/components/home/google-reviews";
import { Hero } from "@/components/home/hero";
import { SellBand } from "@/components/home/sell-band";
import { VisitUs } from "@/components/home/visit-us";
import { getFeaturedVehicles } from "@/server/vehicles/queries";

export default async function HomePage() {
  // Consulta cacheada ("use cache"): la portada sigue siendo estática y se invalida con la etiqueta "vehicles".
  const featured = await getFeaturedVehicles(6);
  return (
    <>
      <Hero />
      {featured.length > 0 ? <FeaturedVehicles vehicles={featured} /> : null}
      <GoogleReviews />
      <Benefits />
      <SellBand />
      <VisitUs />
    </>
  );
}
