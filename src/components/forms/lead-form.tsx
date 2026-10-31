"use client";

import { type ReactNode, useActionState, useId, useState } from "react";
import { buttonClasses } from "@/components/ui/button-link";
import { WhatsAppIcon } from "@/components/ui/icons";
import { inputClass, labelClass, selectClass } from "@/components/vehicles/form-styles";
import { DOWN_PAYMENT_OPTIONS, type LeadForm as LeadFormType, WORKER_OPTIONS } from "@/lib/leads/schema";
import { type LeadFormState, submitLead } from "@/server/leads/actions";

const PAGES: Record<LeadFormType, string> = { financiamiento: "/financiamiento", seguro: "/seguros" };

function Field({
  name,
  label,
  optional,
  error,
  className = "",
  children,
}: {
  name: string;
  label: string;
  optional?: boolean;
  error?: string;
  className?: string;
  children: (props: { id: string; "aria-invalid"?: true; "aria-describedby"?: string }) => ReactNode;
}) {
  const id = `${useId()}-${name}`;
  const errorId = `${id}-error`;
  return (
    <div className={className}>
      <label htmlFor={id} className={labelClass}>
        {label}
        {optional ? <span className="ml-1.5 font-normal tracking-normal normal-case text-mist/70">(opcional)</span> : null}
      </label>
      {children({ id, ...(error ? { "aria-invalid": true as const, "aria-describedby": errorId } : {}) })}
      {error ? (
        <p id={errorId} className="mt-1.5 text-sm text-[#ff9a9a]">
          {error}
        </p>
      ) : null}
    </div>
  );
}

const fieldClass = (error?: string) => `${inputClass} ${error ? "border-brand-red" : ""}`;

function Success({ name, whatsappUrl, form, onReset }: { name: string; whatsappUrl: string; form: LeadFormType; onReset: () => void }) {
  return (
    <div role="status" className="py-4">
      <p className="font-display text-3xl font-extrabold uppercase italic leading-none">
        ¡Listo{name ? `, ${name}` : ""}!
      </p>
      <p className="mt-4 leading-relaxed text-chalk/85">
        Recibimos tu solicitud de {form === "financiamiento" ? "financiamiento" : "seguro"}. Te contactaremos a la brevedad.
      </p>
      <p className="mt-2 text-sm leading-relaxed text-mist">¿Quieres una respuesta más rápida? Envíanos el resumen por WhatsApp.</p>
      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className={buttonClasses("whatsapp", "lg", "whitespace-nowrap px-5")}>
          <WhatsAppIcon className="shrink-0" /> Enviar por WhatsApp
        </a>
        <button type="button" onClick={onReset} className="px-2 py-2 text-sm text-mist underline-offset-4 hover:text-chalk hover:underline">
          Enviar otra solicitud
        </button>
      </div>
    </div>
  );
}

function FormBody({ form, defaultVehicle, onReset }: { form: LeadFormType; defaultVehicle?: string; onReset: () => void }) {
  const [state, action, pending] = useActionState<LeadFormState, FormData>(submitLead, { status: "idle" });
  if (state.status === "success") return <Success name={state.name} whatsappUrl={state.whatsappUrl} form={form} onReset={onReset} />;

  const v = state.status === "error" ? state.values : {};
  const e = state.status === "error" ? state.fieldErrors : {};

  return (
    <form action={action} className="grid gap-5 sm:grid-cols-2">
      <input type="hidden" name="tipo" value={form} />
      <input type="hidden" name="pagina" value={PAGES[form]} />
      {/* Campo trampa para bots: fuera de pantalla y fuera del orden de tabulación. */}
      <div aria-hidden className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label>
          Sitio web
          <input type="text" name="sitio_web" tabIndex={-1} autoComplete="off" defaultValue="" />
        </label>
      </div>

      {state.status === "error" ? (
        <p role="alert" className="rounded-sm border border-brand-red/50 bg-brand-red/10 px-4 py-3 text-sm text-chalk sm:col-span-2">
          {state.message}
        </p>
      ) : null}

      <Field name="nombre" label="Nombre" error={e.nombre} className="sm:col-span-2">
        {(p) => <input {...p} name="nombre" required minLength={2} maxLength={80} autoComplete="name" defaultValue={v.nombre} className={fieldClass(e.nombre)} />}
      </Field>
      <Field name="telefono" label="Teléfono / WhatsApp" error={e.telefono}>
        {(p) => (
          <input
            {...p}
            name="telefono"
            type="tel"
            required
            inputMode="tel"
            autoComplete="tel"
            placeholder="+56 9 1234 5678"
            defaultValue={v.telefono}
            className={fieldClass(e.telefono)}
          />
        )}
      </Field>
      <Field name="email" label="Email" optional error={e.email}>
        {(p) => <input {...p} name="email" type="email" maxLength={120} autoComplete="email" defaultValue={v.email} className={fieldClass(e.email)} />}
      </Field>

      {form === "financiamiento" ? (
        <>
          <Field name="vehiculo" label="Vehículo de interés" optional error={e.vehiculo} className="sm:col-span-2">
            {(p) => (
              <input
                {...p}
                name="vehiculo"
                maxLength={120}
                placeholder="Ej: Peugeot Partner 2024, o el tipo de auto que buscas"
                defaultValue={v.vehiculo ?? defaultVehicle}
                className={fieldClass(e.vehiculo)}
              />
            )}
          </Field>
          <Field name="pie" label="Pie disponible" optional error={e.pie}>
            {(p) => (
              <select {...p} name="pie" defaultValue={v.pie ?? ""} className={selectClass}>
                <option value="">Selecciona</option>
                {DOWN_PAYMENT_OPTIONS.map((o) => (
                  <option key={o}>{o}</option>
                ))}
              </select>
            )}
          </Field>
          <Field name="trabajador" label="Trabajador" optional error={e.trabajador}>
            {(p) => (
              <select {...p} name="trabajador" defaultValue={v.trabajador ?? ""} className={selectClass}>
                <option value="">Selecciona</option>
                {WORKER_OPTIONS.map((o) => (
                  <option key={o}>{o}</option>
                ))}
              </select>
            )}
          </Field>
        </>
      ) : (
        <>
          <Field name="vehiculo" label="Marca y modelo" error={e.vehiculo} className="sm:col-span-2">
            {(p) => (
              <input
                {...p}
                name="vehiculo"
                required
                minLength={2}
                maxLength={120}
                placeholder="Ej: Toyota Hilux 2.4 SRV"
                defaultValue={v.vehiculo}
                className={fieldClass(e.vehiculo)}
              />
            )}
          </Field>
          <Field name="anio" label="Año" optional error={e.anio}>
            {(p) => <input {...p} name="anio" inputMode="numeric" maxLength={4} placeholder="Ej: 2020" defaultValue={v.anio} className={fieldClass(e.anio)} />}
          </Field>
          <Field name="patente" label="Patente" optional error={e.patente}>
            {(p) => (
              <input
                {...p}
                name="patente"
                maxLength={10}
                autoCapitalize="characters"
                placeholder="Ej: BCDF12"
                defaultValue={v.patente}
                className={`${fieldClass(e.patente)} uppercase placeholder:normal-case`}
              />
            )}
          </Field>
        </>
      )}

      <Field name="mensaje" label="Comentario" optional error={e.mensaje} className="sm:col-span-2">
        {(p) => (
          <textarea
            {...p}
            name="mensaje"
            rows={3}
            maxLength={1000}
            defaultValue={v.mensaje}
            className={`${fieldClass(e.mensaje)} h-auto resize-y py-3 leading-relaxed`}
          />
        )}
      </Field>

      <div className="sm:col-span-2">
        <button type="submit" disabled={pending} className={buttonClasses("primary", "lg", "w-full disabled:cursor-wait disabled:opacity-70")}>
          {pending ? "Enviando…" : form === "financiamiento" ? "Solicitar financiamiento" : "Cotizar seguro"}
        </button>
        <p className="mt-3 text-xs leading-relaxed text-mist">
          Al enviar aceptas que AutoDealer te contacte por teléfono, WhatsApp o email para gestionar tu solicitud.
        </p>
      </div>
    </form>
  );
}

/** Formulario de financiamiento o seguro. "Enviar otra solicitud" lo reinicia por completo. */
export function LeadForm({ form, defaultVehicle }: { form: LeadFormType; defaultVehicle?: string }) {
  const [key, setKey] = useState(0);
  return <FormBody key={key} form={form} defaultVehicle={defaultVehicle} onReset={() => setKey((k) => k + 1)} />;
}
