"use client";

import { type ReactNode, useEffect, useId, useRef, useState } from "react";
import { flushSync } from "react-dom";

export interface SelectOption {
  value: string;
  label: string;
}

type Props = {
  name: string;
  options: readonly SelectOption[];
  defaultValue?: string;
  /** Texto cuando no hay valor. */
  placeholder?: string;
  /** Agrega una primera opción con valor vacío (para poder quitar la selección). */
  emptyOption?: string;
  id?: string;
  "aria-label"?: string;
  "aria-invalid"?: boolean;
  "aria-describedby"?: string;
  /** Asocia el valor a un formulario fuera del árbol (atributo form=). */
  form?: string;
  /** Envía el formulario al elegir (orden del catálogo). */
  autoSubmit?: boolean;
  /** Clases del botón. */
  className?: string;
  /** Contenido alternativo del botón en móvil (solo ícono). */
  compactIcon?: ReactNode;
  align?: "left" | "right";
};

const chevron = (
  <svg aria-hidden viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0 text-mist transition-transform group-aria-expanded/sel:rotate-180">
    <path d="M6 9l6 6 6-6" />
  </svg>
);

/**
 * Lista desplegable con diseño propio (no la del navegador). Accesible como combobox de
 * solo lectura: flechas, Inicio/Fin, Enter/Espacio, Escape y búsqueda por la primera letra.
 * El valor viaja en un input oculto, así funciona dentro de cualquier formulario.
 */
export function Select({
  name,
  options: baseOptions,
  defaultValue = "",
  placeholder = "Selecciona",
  emptyOption,
  id,
  form,
  autoSubmit,
  className = "",
  compactIcon,
  align = "left",
  ...aria
}: Props) {
  const options = emptyOption ? [{ value: "", label: emptyOption }, ...baseOptions] : baseOptions;
  const [value, setValue] = useState(defaultValue);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const autoId = useId();
  const buttonId = id ?? `${autoId}-btn`;
  const listId = `${autoId}-list`;
  const selected = options.find((o) => o.value === value);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [open]);

  // Mantiene visible la opción activa al navegar con el teclado.
  useEffect(() => {
    if (open) listRef.current?.children[active]?.scrollIntoView({ block: "nearest" });
  }, [open, active]);

  function show() {
    setActive(Math.max(0, options.findIndex((o) => o.value === value)));
    setOpen(true);
  }

  function choose(i: number) {
    const opt = options[i];
    setOpen(false);
    buttonRef.current?.focus();
    if (!opt || opt.value === value) return;
    flushSync(() => setValue(opt.value));
    // Avisa como un input real (p. ej. para limpiar el error del campo).
    inputRef.current?.dispatchEvent(new Event("input", { bubbles: true }));
    if (autoSubmit) {
      const target = form ? (document.getElementById(form) as HTMLFormElement | null) : inputRef.current?.form;
      target?.requestSubmit();
    }
  }

  function onKeyDown(e: React.KeyboardEvent) {
    const last = options.length - 1;
    if (!open) {
      if (["ArrowDown", "ArrowUp", "Enter", " "].includes(e.key)) {
        e.preventDefault();
        show();
      }
      return;
    }
    if (e.key === "ArrowDown") setActive((a) => Math.min(last, a + 1));
    else if (e.key === "ArrowUp") setActive((a) => Math.max(0, a - 1));
    else if (e.key === "Home") setActive(0);
    else if (e.key === "End") setActive(last);
    else if (e.key === "Enter" || e.key === " ") choose(active);
    else if (e.key === "Escape" || e.key === "Tab") {
      setOpen(false);
      if (e.key === "Tab") return;
    } else if (e.key.length === 1) {
      const k = e.key.toLowerCase();
      const from = options.findIndex((o, i) => i > active && o.label.toLowerCase().startsWith(k));
      const i = from >= 0 ? from : options.findIndex((o) => o.label.toLowerCase().startsWith(k));
      if (i >= 0) setActive(i);
      return;
    } else return;
    e.preventDefault();
  }

  return (
    <div ref={rootRef} className="relative">
      <input ref={inputRef} type="hidden" name={name} value={value} form={form} />
      <button
        ref={buttonRef}
        id={buttonId}
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-activedescendant={open ? `${listId}-${active}` : undefined}
        aria-label={aria["aria-label"]}
        aria-invalid={aria["aria-invalid"]}
        aria-describedby={aria["aria-describedby"]}
        onClick={() => (open ? setOpen(false) : show())}
        onKeyDown={onKeyDown}
        className={`group/sel flex h-12 w-full items-center justify-between gap-2 rounded-sm border border-white/12 bg-ink/70 px-3.5 text-left text-sm transition-colors hover:border-white/30 focus-visible:border-brand-yellow focus-visible:outline-none aria-expanded:border-brand-yellow aria-invalid:border-brand-red ${className}`}
      >
        {compactIcon ? <span className="grid w-full place-items-center sm:hidden">{compactIcon}</span> : null}
        <span className={`min-w-0 truncate ${selected && selected.value !== "" ? "text-chalk" : "text-mist/80"} ${compactIcon ? "max-sm:hidden" : ""}`}>
          {selected?.label ?? placeholder}
        </span>
        <span className={`flex shrink-0 ${compactIcon ? "max-sm:hidden" : ""}`}>{chevron}</span>
      </button>
      {open ? (
        <ul
          ref={listRef}
          id={listId}
          role="listbox"
          aria-labelledby={buttonId}
          className={`absolute top-full z-50 mt-1.5 max-h-72 min-w-full overflow-y-auto overscroll-contain rounded-md border border-white/12 bg-graphite-900 py-1.5 shadow-[0_24px_50px_-20px_rgba(0,0,0,0.9)] ${align === "right" ? "right-0" : "left-0"}`}
        >
          {options.map((o, i) => {
            const isSel = o.value === value;
            return (
              <li
                key={o.value || "__empty"}
                id={`${listId}-${i}`}
                role="option"
                aria-selected={isSel}
                onPointerEnter={() => setActive(i)}
                onClick={() => choose(i)}
                className={`flex cursor-pointer items-center justify-between gap-6 px-3.5 py-2.5 text-sm whitespace-nowrap ${
                  i === active ? "bg-white/[0.07] text-chalk" : "text-chalk/85"
                } ${isSel ? "font-semibold text-brand-yellow" : ""}`}
              >
                {o.label}
                {isSel ? (
                  <svg aria-hidden viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" className="shrink-0">
                    <path d="M5 12.5l4.5 4.5L19 7.5" />
                  </svg>
                ) : null}
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
