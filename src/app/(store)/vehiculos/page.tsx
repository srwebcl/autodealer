import type { Metadata } from "next";
import { Container } from "@/components/layout/container";
import { PageHero } from "@/components/layout/page-hero";
import { DemoNotice } from "@/components/vehicles/demo-notice";
import { VehicleGrid } from "@/components/vehicles/vehicle-grid";
import { DEMO_VEHICLES } from "@/lib/demo/vehicles";

export const metadata: Metadata = {
  title: "Vehículos disponibles",
  description: "Catálogo de vehículos disponibles en AutoDealer, La Serena.",
  // Fase 1: catálogo demo, no indexar hasta tener datos reales.
  robots: { index: false, follow: true },
};

// Fase 1: listado con datos demo. Filtros, orden y paginación llegan en la Fase 3.
export default function VehiclesPage() {
  return (
    <>
      <PageHero
        eyebrow="Catálogo"
        title={
          <>
            Vehículos <span className="text-brand-yellow">disponibles</span>
          </>
        }
      >
        <p>Todas las unidades publicadas, con precio y datos clave. Consulta por WhatsApp para coordinar una visita.</p>
      </PageHero>
      <Container className="py-14 sm:py-20">
        <DemoNotice />
        <p className="mt-6 text-sm text-mist">
          {DEMO_VEHICLES.length} vehículos <span className="text-chalk/50">· filtros disponibles próximamente</span>
        </p>
        <div className="mt-6">
          <VehicleGrid vehicles={DEMO_VEHICLES} headingLevel={2} />
        </div>
      </Container>
    </>
  );
}
