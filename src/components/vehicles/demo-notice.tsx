export function DemoNotice() {
  return (
    <p
      role="note"
      className="flex items-start gap-3 rounded-sm border border-dashed border-brand-yellow/50 bg-brand-yellow/5 px-4 py-3 text-sm text-chalk/90"
    >
      <span className="mt-0.5 rounded-sm bg-brand-yellow px-1.5 py-0.5 text-[0.62rem] font-bold uppercase tracking-[0.16em] text-ink">
        Demo
      </span>
      <span>
        Vehículos, precios y datos de demostración para revisar el diseño. No corresponden al inventario real de AutoDealer.
      </span>
    </p>
  );
}
