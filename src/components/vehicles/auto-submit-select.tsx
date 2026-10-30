"use client";

import type { ComponentProps } from "react";

/** Select que envía su formulario al cambiar. Sin JS, el botón "Aplicar" sigue funcionando. */
export function AutoSubmitSelect(props: ComponentProps<"select">) {
  return (
    <select
      {...props}
      onChange={(event) => {
        props.onChange?.(event);
        event.currentTarget.form?.requestSubmit();
      }}
    />
  );
}
