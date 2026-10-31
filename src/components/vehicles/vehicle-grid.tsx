import type { VehicleCardData } from "@/types/vehicle";
import { VehicleCard } from "./vehicle-card";

/** dense: catálogo (hasta 4 columnas, prioriza ver más unidades); normal: secciones de 3. */
export function VehicleGrid({ vehicles, headingLevel, dense = false }: { vehicles: VehicleCardData[]; headingLevel?: 2 | 3; dense?: boolean }) {
  return (
    <ul className={`grid gap-x-5 gap-y-8 sm:grid-cols-2 lg:grid-cols-3 ${dense ? "xl:grid-cols-4" : ""}`}>
      {vehicles.map((vehicle, i) => (
        <li key={vehicle.id} className="flex">
          <VehicleCard vehicle={vehicle} headingLevel={headingLevel} preload={dense && i < 2} />
        </li>
      ))}
    </ul>
  );
}
