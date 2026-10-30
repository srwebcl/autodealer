import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowRightIcon, CalendarIcon, GaugeIcon, GearboxIcon } from "@/components/ui/icons";
import { formatClp, formatKm } from "@/lib/utils/format";
import type { VehicleCardData } from "@/types/vehicle";
import { StatusBadge } from "./status-badge";
import { VehiclePhotoPlaceholder } from "./vehicle-photo-placeholder";

export function VehicleCard({ vehicle, headingLevel = 3 }: { vehicle: VehicleCardData; headingLevel?: 2 | 3 }) {
  const price = formatClp(vehicle.priceClp);
  const km = formatKm(vehicle.mileageKm);
  const Heading = headingLevel === 2 ? "h2" : "h3";
  const href = `/vehiculos/${vehicle.slug}`;

  type Spec = { icon: ReactNode; label: string; value: string };
  const candidates: (Spec | null)[] = [
    vehicle.year ? { icon: <CalendarIcon width={16} height={16} />, label: "Año", value: String(vehicle.year) } : null,
    km ? { icon: <GaugeIcon width={16} height={16} />, label: "Kilometraje", value: km } : null,
    vehicle.transmission
      ? { icon: <GearboxIcon width={16} height={16} />, label: "Transmisión", value: vehicle.transmission }
      : null,
  ];
  const specs = candidates.filter((s): s is Spec => s !== null);

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-md border border-white/8 bg-graphite-900 transition-[border-color,transform,box-shadow] duration-300 ease-out-quart hover:-translate-y-1 hover:border-white/20 hover:shadow-[0_24px_50px_-20px_rgba(0,0,0,0.8)]">
      <div className="relative aspect-square overflow-hidden bg-graphite-800">
        {vehicle.image ? (
          <Image
            src={vehicle.image.src}
            alt={vehicle.image.alt}
            fill
            sizes="(min-width: 1280px) 400px, (min-width: 640px) 50vw, 100vw"
            className="object-cover transition-transform duration-700 ease-out-quart group-hover:scale-105"
          />
        ) : (
          <VehiclePhotoPlaceholder label={vehicle.isDemo ? "Foto demo" : undefined} />
        )}
        <div className="absolute inset-x-0 top-0 flex items-start justify-between p-3">
          <StatusBadge status={vehicle.status} />
          {vehicle.isDemo ? (
            <span className="ml-auto rounded-sm bg-ink/80 px-2 py-1 text-[0.62rem] font-bold uppercase tracking-[0.18em] text-brand-yellow ring-1 ring-brand-yellow/40">
              Demo
            </span>
          ) : null}
        </div>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-mist">{vehicle.make}</p>
        <Heading className="mt-1 font-display text-2xl leading-tight font-bold uppercase italic tracking-tight">
          <Link href={href} className="after:absolute after:inset-0 focus-visible:outline-none">
            {vehicle.model}
          </Link>
          {vehicle.version ? (
            <span className="ml-2 align-middle font-sans text-sm font-medium normal-case not-italic tracking-normal text-mist">
              {vehicle.version}
            </span>
          ) : null}
        </Heading>

        {specs.length > 0 ? (
          <dl className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-sm text-chalk/85">
            {specs.map((spec) => (
              <div key={spec.label} className="flex items-center gap-1.5">
                <dt className="text-mist">
                  {spec.icon}
                  <span className="sr-only">{spec.label}</span>
                </dt>
                <dd>{spec.value}</dd>
              </div>
            ))}
          </dl>
        ) : null}

        <div className="mt-auto pt-5">
          <div className="flex items-end justify-between border-t border-white/8 pt-4">
            <div>
              <p className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-mist">Precio</p>
              <p className="font-display text-[1.7rem] leading-none font-bold tracking-tight">
                {price ?? <span className="text-chalk/80">Consultar</span>}
              </p>
            </div>
            <span
              aria-hidden
              className="grid size-10 place-items-center rounded-sm bg-white/5 text-chalk transition-colors group-hover:bg-brand-red"
            >
              <ArrowRightIcon />
            </span>
          </div>
        </div>
      </div>
      {/* Foco visible para toda la tarjeta cuando el enlace estirado recibe foco. */}
      <span aria-hidden className="pointer-events-none absolute inset-0 rounded-md ring-brand-yellow group-has-[a:focus-visible]:ring-2" />
    </article>
  );
}
