import { Container } from "@/components/layout/container";
import { ButtonLink } from "@/components/ui/button-link";
import { ArrowRightIcon } from "@/components/ui/icons";
import { SectionHeading } from "@/components/ui/section-heading";
import { VehicleGrid } from "@/components/vehicles/vehicle-grid";
import type { VehicleCardData } from "@/types/vehicle";

export function FeaturedVehicles({ vehicles }: { vehicles: VehicleCardData[] }) {
  return (
    <section aria-labelledby="featured-title" className="pt-10 pb-20 sm:pt-14 sm:pb-28">
      <Container>
        <SectionHeading
          id="featured-title"
          eyebrow="Recién llegados"
          title={
            <>
              Vehículos <span className="text-brand-yellow">disponibles</span>
            </>
          }
          description="Las últimas unidades publicadas en nuestro Instagram, con fotos, precio y datos clave."
          aside={
            <ButtonLink href="/vehiculos" variant="outline" className="self-start md:self-end">
              Ver todo el catálogo <ArrowRightIcon />
            </ButtonLink>
          }
        />
        <div className="mt-8">
          <VehicleGrid vehicles={vehicles} />
        </div>
      </Container>
    </section>
  );
}
