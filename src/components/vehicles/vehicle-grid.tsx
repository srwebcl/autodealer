import type { VehicleCardData } from "@/types/vehicle";
import { VehicleCard } from "./vehicle-card";

export function VehicleGrid({ vehicles, headingLevel }: { vehicles: VehicleCardData[]; headingLevel?: 2 | 3 }) {
  return (
    <ul className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
      {vehicles.map((vehicle) => (
        <li key={vehicle.id} className="flex">
          <div className="flex w-full flex-col [&>article]:flex-1">
            <VehicleCard vehicle={vehicle} headingLevel={headingLevel} />
          </div>
        </li>
      ))}
    </ul>
  );
}
