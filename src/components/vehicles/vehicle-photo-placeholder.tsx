/** Ilustración neutra para vehículos sin foto. No simula una foto real. */
export function VehiclePhotoPlaceholder({ label = "Foto no disponible" }: { label?: string }) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-[radial-gradient(ellipse_at_50%_35%,var(--color-graphite-700),var(--color-graphite-900)_70%)]">
      <svg viewBox="0 0 200 80" className="w-3/5 text-white/12" fill="currentColor" aria-hidden>
        <path d="M8 60l7-15c4-6 12-9 26-10l20-2c13-10 26-14 41-14h28c16 0 28 5 40 14l14 3c8 2 12 6 13 13v11z" />
        <circle cx="52" cy="60" r="12" className="text-graphite-900" fill="currentColor" />
        <circle cx="52" cy="60" r="7" />
        <circle cx="156" cy="60" r="12" className="text-graphite-900" fill="currentColor" />
        <circle cx="156" cy="60" r="7" />
      </svg>
      <span className="text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-white/35">{label}</span>
    </div>
  );
}
