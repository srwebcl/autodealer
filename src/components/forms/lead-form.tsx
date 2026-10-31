"use client";

import Link from "next/link";
import { type ReactNode, useActionState, useId, useState } from "react";
import { buttonClasses } from "@/components/ui/button-link";
import { ArrowRightIcon, WhatsAppIcon } from "@/components/ui/icons";
import { Select } from "@/components/ui/select";
import { inputClass, labelClass } from "@/components/vehicles/form-styles";
import {
  CONTACT_TOPIC_OPTIONS,
  DOWN_PAYMENT_OPTIONS,
  type LeadForm as LeadFormType,
  SELL_MODE_OPTIONS,
  WORKER_OPTIONS,
} from "@/lib/leads/schema";
import { type LeadFormState, submitLead } from "@/server/leads/actions";

const FORMS: Record<LeadFormType, { page: string; submit: string; received: string; whatsappHint: string }> = {
  financiamiento: {
    page: "/financiamiento",
    submit: "Solicitar evaluación",
    received: "Recibimos tu solicitud de financiamiento.",
    whatsappHint: "¿Quieres una respuesta más rápida? Envíanos el resumen por WhatsApp.",
  },
  seguro: {
    page: "/seguros",
    submit: "Cotizar mi seguro",
    received: "Recibimos tu solicitud de seguro.",
    whatsappHint: "¿Quieres una respuesta más rápida? Envíanos el resumen por WhatsApp.",
  },
  vende: {
    page: "/vende-tu-auto",
    submit: "Quiero evaluar mi auto",
    received: "Recibimos los datos de tu auto.",
    whatsappHint: "Para avanzar más rápido, envíanos el resumen por WhatsApp junto con algunas fotos del auto.",
  },
  contacto: {
    page: "/contacto",
    submit: "Enviar mensaje",
    received: "Recibimos tu mensaje.",
    whatsappHint: "¿Quieres una respuesta más rápida? Envíanos el mensaje por WhatsApp.",
  },
};

const SELL_MODE_HINTS: Record<string, string> = {
  "Dejarlo en consignación": "Lo dejas con nosotros y lo vendemos por ti.",
  "Parte de pago por otro auto": "Lo entregas como parte del pago de uno de nuestros autos.",
  "Aún no lo sé": "Te contamos las alternativas y decides después.",
};

/** En Contacto, si el motivo tiene una página propia, se sugiere usarla. */
const TOPIC_SHORTCUTS: Record<string, { href: string; label: string }> = {
  "Comprar un vehículo": { href: "/vehiculos", label: "al catálogo de vehículos" },
  "Vender o consignar mi auto": { href: "/vende-tu-auto#formulario", label: "al formulario de Vende tu auto" },
  Financiamiento: { href: "/financiamiento#formulario", label: "al formulario de financiamiento" },
  Seguro: { href: "/seguros#formulario", label: "al cotizador de seguros" },
};

const YEAR_OPTIONS = (() => {
  const top = new Date().getFullYear() + 1;
  return Array.from({ length: top - 1989 }, (_, i) => String(top - i)).map((y) => ({ value: y, label: y }));
})();

type FieldA11y = { id: string; "aria-invalid"?: true; "aria-describedby"?: string };

/** Error visible hasta que la persona edita el campo (cada envío trae su propio aviso). */
function useFieldError(error: string | undefined, attempt: unknown) {
  const [editedOn, setEditedOn] = useState<unknown>(null);
  return { shown: error && editedOn !== attempt ? error : undefined, onInput: () => error && setEditedOn(attempt) };
}

function Field({
  name,
  label,
  optional,
  error: rawError,
  attempt,
  children,
}: {
  name: string;
  label: string;
  optional?: boolean;
  error?: string;
  attempt?: unknown;
  children: (props: FieldA11y) => ReactNode;
}) {
  const id = `${useId()}-${name}`;
  const errorId = `${id}-error`;
  const { shown: error, onInput } = useFieldError(rawError, attempt);
  return (
    <div onInput={onInput}>
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

const fieldClass = `${inputClass} h-12 text-[0.95rem] aria-invalid:border-brand-red`;

/** Opciones como botones (radio): más rápido que una lista y se ve todo de una vez. */
function Choices({
  name,
  label,
  options,
  defaultValue,
  error,
  cards,
  onChange,
}: {
  name: string;
  label: string;
  options: readonly string[];
  defaultValue?: string;
  error?: string;
  cards?: Record<string, string>;
  onChange?: (value: string) => void;
}) {
  const id = useId();
  return (
    <fieldset aria-describedby={error ? `${id}-error` : undefined}>
      <legend className={labelClass}>
        {label}
        <span className="ml-1.5 font-normal tracking-normal normal-case text-mist/70">(opcional)</span>
      </legend>
      <div className={cards ? "grid gap-2" : "flex flex-wrap gap-2"}>
        {options.map((o) => (
          <label
            key={o}
            className={`group cursor-pointer rounded-sm border border-white/12 bg-ink/50 transition-colors select-none hover:border-white/30 has-checked:border-brand-yellow has-checked:bg-brand-yellow/10 has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-brand-yellow ${
              cards ? "flex items-start gap-3 p-4" : "inline-flex h-10 items-center px-3.5 text-sm text-chalk/85 has-checked:text-brand-yellow"
            }`}
          >
            <input
              type="radio"
              name={name}
              value={o}
              defaultChecked={defaultValue === o}
              onChange={(ev) => ev.currentTarget.checked && onChange?.(o)}
              className="sr-only"
            />
            {cards ? (
              <>
                <span
                  aria-hidden
                  className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full border-2 border-white/25 transition-colors group-has-checked:border-brand-yellow"
                >
                  <span className="size-2 scale-0 rounded-full bg-brand-yellow transition-transform group-has-checked:scale-100" />
                </span>
                <span>
                  <span className="block font-semibold text-chalk">{o}</span>
                  {cards[o] ? <span className="mt-0.5 block text-sm text-mist">{cards[o]}</span> : null}
                </span>
              </>
            ) : (
              o
            )}
          </label>
        ))}
      </div>
      {error ? (
        <p id={`${id}-error`} className="mt-1.5 text-sm text-[#ff9a9a]">
          {error}
        </p>
      ) : null}
    </fieldset>
  );
}

/** Bloque numerado del formulario ("1 · Tu auto"). */
function Step({ n, title, children }: { n: number; title: string; children: ReactNode }) {
  return (
    <section className={n > 1 ? "border-t border-white/8 pt-6" : ""}>
      <h3 className="mb-5 flex items-center gap-3 font-display text-lg font-bold uppercase italic tracking-tight">
        <span aria-hidden className="grid size-7 -skew-x-[12deg] place-items-center rounded-sm bg-brand-yellow text-sm font-extrabold text-ink not-italic">
          <span className="skew-x-[12deg]">{n}</span>
        </span>
        {title}
      </h3>
      <div className="grid gap-5">{children}</div>
    </section>
  );
}

function Success({ name, whatsappUrl, form, onReset }: { name: string; whatsappUrl: string; form: LeadFormType; onReset: () => void }) {
  return (
    <div role="status" className="py-4">
      <p className="font-display text-3xl font-extrabold uppercase italic leading-none">
        ¡Listo{name ? `, ${name}` : ""}!
      </p>
      <p className="mt-4 leading-relaxed text-chalk/85">{FORMS[form].received} Te contactaremos a la brevedad.</p>
      <p className="mt-2 text-sm leading-relaxed text-mist">{FORMS[form].whatsappHint}</p>
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
  const [topic, setTopic] = useState("");
  if (state.status === "success") return <Success name={state.name} whatsappUrl={state.whatsappUrl} form={form} onReset={onReset} />;

  const v = state.status === "error" ? state.values : {};
  const e = state.status === "error" ? state.fieldErrors : {};
  const shortcut = form === "contacto" ? TOPIC_SHORTCUTS[topic || v.motivo || ""] : undefined;

  const vehicleField = (placeholder: string, required: boolean, label = "Marca y modelo") => (
    <Field attempt={state} name="vehiculo" label={label} optional={!required} error={e.vehiculo}>
      {(p) => (
        <input
          {...p}
          name="vehiculo"
          required={required}
          minLength={required ? 2 : undefined}
          maxLength={120}
          placeholder={placeholder}
          defaultValue={v.vehiculo ?? defaultVehicle}
          className={fieldClass}
        />
      )}
    </Field>
  );

  const yearField = (required: boolean) => (
    <Field attempt={state} name="anio" label="Año" optional={!required} error={e.anio}>
      {(p) => <Select {...p} name="anio" options={YEAR_OPTIONS} defaultValue={v.anio ?? ""} placeholder="Selecciona el año" />}
    </Field>
  );

  const plateField = (
    <Field attempt={state} name="patente" label="Patente" optional error={e.patente}>
      {(p) => (
        <input
          {...p}
          name="patente"
          maxLength={10}
          autoCapitalize="characters"
          placeholder="Ej: BCDF12"
          defaultValue={v.patente}
          className={`${fieldClass} uppercase placeholder:normal-case`}
        />
      )}
    </Field>
  );

  const contactFields = (
    <>
      <Field attempt={state} name="nombre" label="Nombre y apellido" error={e.nombre}>
        {(p) => <input {...p} name="nombre" required minLength={2} maxLength={80} autoComplete="name" defaultValue={v.nombre} className={fieldClass} />}
      </Field>
      <Field attempt={state} name="telefono" label="Teléfono / WhatsApp" error={e.telefono}>
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
            className={fieldClass}
          />
        )}
      </Field>
      <Field attempt={state} name="email" label="Email" error={e.email}>
        {(p) => (
          <input
            {...p}
            name="email"
            type="email"
            required
            maxLength={120}
            autoComplete="email"
            placeholder="nombre@correo.cl"
            defaultValue={v.email}
            className={fieldClass}
          />
        )}
      </Field>
    </>
  );

  const messageField = (label: string, required = false) => (
    <Field attempt={state} name="mensaje" label={label} optional={!required} error={e.mensaje}>
      {(p) => (
        <textarea
          {...p}
          name="mensaje"
          rows={required ? 5 : 3}
          required={required}
          minLength={required ? 5 : undefined}
          maxLength={1000}
          defaultValue={v.mensaje}
          className={`${fieldClass} h-auto resize-y py-3 leading-relaxed`}
        />
      )}
    </Field>
  );

  let steps: ReactNode;
  if (form === "financiamiento") {
    steps = (
      <>
        <Step n={1} title="El auto que buscas">
          {vehicleField("Ej: Peugeot Partner 2024, o el tipo de auto que buscas", false, "¿Qué auto te interesa?")}
          <Choices name="pie" label="¿Cuánto pie tienes?" options={DOWN_PAYMENT_OPTIONS} defaultValue={v.pie} error={e.pie} />
          <Choices name="trabajador" label="Situación laboral" options={WORKER_OPTIONS} defaultValue={v.trabajador} error={e.trabajador} />
        </Step>
        <Step n={2} title="Tus datos">
          {contactFields}
          {messageField("¿Algo más que debamos saber?")}
        </Step>
      </>
    );
  } else if (form === "seguro") {
    steps = (
      <>
        <Step n={1} title="El auto a asegurar">
          {vehicleField("Ej: Toyota Hilux 2.4 SRV", true)}
          {yearField(false)}
          {plateField}
        </Step>
        <Step n={2} title="Tus datos">
          {contactFields}
          {messageField("¿Algo más que debamos saber?")}
        </Step>
      </>
    );
  } else if (form === "vende") {
    steps = (
      <>
        <Step n={1} title="¿Qué te interesa?">
          <Choices name="modalidad" label="Elige una opción" options={SELL_MODE_OPTIONS} cards={SELL_MODE_HINTS} defaultValue={v.modalidad} error={e.modalidad} />
        </Step>
        <Step n={2} title="Tu auto">
          {vehicleField("Ej: Kia Rio 5 EX", true)}
          {yearField(true)}
          <Field attempt={state} name="kilometraje" label="Kilometraje" optional error={e.kilometraje}>
            {(p) => (
              <input
                {...p}
                name="kilometraje"
                inputMode="numeric"
                maxLength={12}
                placeholder="Ej: 85.000"
                defaultValue={v.kilometraje}
                className={fieldClass}
              />
            )}
          </Field>
          {plateField}
        </Step>
        <Step n={3} title="Tus datos">
          {contactFields}
          {messageField("¿Algo más sobre el auto?")}
        </Step>
      </>
    );
  } else {
    steps = (
      <>
        <Step n={1} title="¿En qué te ayudamos?">
          <Choices name="motivo" label="Motivo" options={CONTACT_TOPIC_OPTIONS} defaultValue={v.motivo} error={e.motivo} onChange={setTopic} />
          {shortcut ? (
            <p className="-mt-1 text-sm text-mist">
              También puedes ir{" "}
              <Link href={shortcut.href} className="font-semibold text-chalk underline decoration-white/30 underline-offset-4 hover:text-brand-yellow">
                {shortcut.label}
              </Link>
              .
            </p>
          ) : null}
          {messageField("Tu mensaje", true)}
        </Step>
        <Step n={2} title="Tus datos">
          {contactFields}
        </Step>
      </>
    );
  }

  return (
    <form action={action} className="grid gap-7">
      <input type="hidden" name="tipo" value={form} />
      <input type="hidden" name="pagina" value={FORMS[form].page} />
      {/* Campo trampa para bots: fuera de pantalla y fuera del orden de tabulación. */}
      <div aria-hidden className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label>
          Sitio web
          <input type="text" name="sitio_web" tabIndex={-1} autoComplete="off" defaultValue="" />
        </label>
      </div>

      {state.status === "error" ? (
        <p role="alert" className="rounded-sm border border-brand-red/50 bg-brand-red/10 px-4 py-3 text-sm text-chalk">
          {state.message}
        </p>
      ) : null}

      {steps}

      <div>
        <button type="submit" disabled={pending} className={buttonClasses("primary", "lg", "w-full disabled:cursor-wait disabled:opacity-70")}>
          {pending ? "Enviando…" : FORMS[form].submit}
          {pending ? null : <ArrowRightIcon />}
        </button>
        <p className="mt-3 text-xs leading-relaxed text-mist">
          Al enviar aceptas que AutoDealer te contacte por teléfono, WhatsApp o email para gestionar tu solicitud.
        </p>
      </div>
    </form>
  );
}

/** Formulario de contacto según la página (financiamiento, seguro, venta o contacto general). */
export function LeadForm({ form, defaultVehicle }: { form: LeadFormType; defaultVehicle?: string }) {
  const [key, setKey] = useState(0);
  return <FormBody key={key} form={form} defaultVehicle={defaultVehicle} onReset={() => setKey((k) => k + 1)} />;
}
