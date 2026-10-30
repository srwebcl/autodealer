"use client";

import { type ReactNode, useId, useState } from "react";

/** En móvil el panel de filtros se pliega; en escritorio siempre está visible. Un solo formulario en el DOM. */
export function FiltersDisclosure({ activeCount, children }: { activeCount: number; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  return (
    <div className="rounded-md border border-white/10 bg-graphite-900 lg:border-0 lg:bg-transparent">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-4 py-3.5 text-sm font-semibold uppercase tracking-[0.12em] lg:hidden"
      >
        <span>
          Filtros
          {activeCount > 0 ? (
            <span className="ml-2 rounded-sm bg-brand-yellow px-1.5 py-0.5 text-xs text-ink">{activeCount}</span>
          ) : null}
        </span>
        <span aria-hidden className={`text-lg transition-transform ${open ? "rotate-45" : ""}`}>
          +
        </span>
      </button>
      <div id={panelId} className={`border-t border-white/10 p-4 lg:block lg:border-0 lg:p-0 ${open ? "" : "max-lg:hidden"}`}>
        {children}
      </div>
    </div>
  );
}
