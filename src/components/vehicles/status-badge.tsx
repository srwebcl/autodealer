import type { VehicleStatus } from "@/types/vehicle";

const labels: Partial<Record<VehicleStatus, { text: string; className: string }>> = {
  RESERVED: { text: "Reservado", className: "bg-brand-yellow text-ink" },
  SOLD: { text: "Vendido", className: "bg-white text-ink" },
};

/** Solo se muestra para estados distintos de disponible. */
export function StatusBadge({ status }: { status: VehicleStatus }) {
  const badge = labels[status];
  if (!badge) return null;
  return (
    <span className={`rounded-sm px-2.5 py-1 text-[0.68rem] font-bold uppercase tracking-[0.14em] ${badge.className}`}>
      {badge.text}
    </span>
  );
}
