/**
 * Marca visible para textos provisionales que el cliente aún no valida.
 * Buscar `<DraftBadge` para encontrar todo lo pendiente antes del lanzamiento.
 */
export function DraftBadge({ label = "Texto provisional" }: { label?: string }) {
  return (
    <span className="inline-flex items-center rounded-sm border border-dashed border-brand-yellow/60 px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-brand-yellow/90">
      {label}
    </span>
  );
}
