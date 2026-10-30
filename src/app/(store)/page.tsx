import { Benefits } from "@/components/home/benefits";
import { FeaturedVehicles } from "@/components/home/featured-vehicles";
import { Hero } from "@/components/home/hero";
import { SellBand } from "@/components/home/sell-band";
import { VisitUs } from "@/components/home/visit-us";
import { DEMO_VEHICLES } from "@/lib/demo/vehicles";

export default function HomePage() {
  return (
    <>
      <Hero />
      {/* Fase 1: datos demo. En la Fase 3 se leen los vehículos publicados desde la base. */}
      <FeaturedVehicles vehicles={DEMO_VEHICLES} />
      <Benefits />
      <SellBand />
      <VisitUs />
    </>
  );
}
