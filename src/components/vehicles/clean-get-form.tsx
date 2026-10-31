"use client";

import { useRouter } from "next/navigation";
import type { ComponentProps, FormEvent } from "react";

type Props = Omit<ComponentProps<"form">, "action" | "method" | "onSubmit"> & {
  action: string;
  /** Valores que equivalen al defecto y no deben ir en la URL. */
  defaults?: Record<string, string>;
};

/**
 * Formulario GET que navega en el cliente omitiendo campos vacíos o por defecto
 * (URLs limpias y compartibles). Sin JavaScript funciona como un form nativo.
 */
export function CleanGetForm({ action, defaults = {}, children, ...props }: Props) {
  const router = useRouter();

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const submitter = (event.nativeEvent as SubmitEvent).submitter;
    const data = new FormData(event.currentTarget, submitter);
    const params = new URLSearchParams();
    for (const [key, value] of data) {
      if (typeof value !== "string") continue;
      const v = value.trim();
      if (v && defaults[key] !== v && !params.has(key)) params.set(key, v);
    }
    const qs = params.toString();
    router.push(qs ? `${action}?${qs}` : action, { scroll: false });
    // Si el formulario vive en un panel (popover) abierto, se cierra al aplicar.
    const sheet = event.currentTarget.closest<HTMLElement>("[popover]");
    if (sheet?.matches(":popover-open")) sheet.hidePopover();
  }

  return (
    <form action={action} method="get" onSubmit={onSubmit} {...props}>
      {children}
    </form>
  );
}
