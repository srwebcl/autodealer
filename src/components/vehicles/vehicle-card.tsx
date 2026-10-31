import Image from "next/image";
import Link from "next/link";
import { formatClp, formatKm } from "@/lib/utils/format";
import type { VehicleCardData } from "@/types/vehicle";
import { StatusBadge } from "./status-badge";
import { VehiclePhotoPlaceholder } from "./vehicle-photo-placeholder";

export function VehicleCard({
  vehicle,
  headingLevel = 3,
  preload = false,
}: {
  vehicle: VehicleCardData;
  headingLevel?: 2 | 3;
  preload?: boolean;
}) {
  const price = formatClp(vehicle.priceClp);
  const Heading = headingLevel === 2 ? "h2" : "h3";
  const href = `/vehiculos/${vehicle.slug}`;
  const specs = [formatKm(vehicle.mileageKm), vehicle.transmission, vehicle.fuelType].filter(Boolean);

  return (
    <article className="group relative flex w-full flex-col">
      <div className="relative aspect-square overflow-hidden rounded-md bg-graphite-800">
        {vehicle.image ? (
          <Image
            src={vehicle.image.src}
            alt={vehicle.image.alt}
            fill
            preload={preload}
            sizes="(min-width: 1280px) 300px, (min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover transition-transform duration-700 ease-out-quart group-hover:scale-[1.04]"
          />
        ) : (
          <VehiclePhotoPlaceholder />
        )}
        <div className="absolute top-3 left-3">
          <StatusBadge status={vehicle.status} />
        </div>
      </div>

      <div className="flex flex-1 flex-col pt-4">
        <p className="text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-mist">
          {vehicle.make}
          {vehicle.year ? <span className="text-chalk/60"> · {vehicle.year}</span> : null}
        </p>
        <Heading className="mt-1 line-clamp-2 text-lg leading-snug font-semibold text-chalk">
          <Link href={href} className="after:absolute after:inset-0 focus-visible:outline-none">
            <span className="font-display text-[1.45rem] font-bold uppercase italic tracking-tight">{vehicle.model}</span>
            {vehicle.version ? <span className="ml-1.5 text-sm font-normal text-mist">{vehicle.version}</span> : null}
          </Link>
        </Heading>
        {specs.length > 0 ? <p className="mt-1.5 text-sm text-chalk/70">{specs.join(" · ")}</p> : null}
        <p className="mt-auto pt-3 font-display text-[1.6rem] leading-none font-bold tracking-tight text-chalk transition-colors group-hover:text-brand-yellow">
          {price ?? <span className="text-chalk/70">Consultar precio</span>}
        </p>
      </div>
      {/* Foco visible para toda la tarjeta cuando el enlace estirado recibe foco. */}
      <span aria-hidden className="pointer-events-none absolute -inset-2 rounded-lg ring-brand-yellow group-has-[a:focus-visible]:ring-2" />
    </article>
  );
}
