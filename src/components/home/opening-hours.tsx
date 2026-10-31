"use client";

import { useSyncExternalStore } from "react";
import { siteConfig } from "@/config/site";
import {
  describeStatus,
  localClock,
  openingStatus,
} from "@/lib/utils/opening-hours";

// Reloj por minuto. En el servidor no hay hora: el estado aparece al hidratar.
function subscribeMinute(cb: () => void) {
  const id = window.setInterval(cb, 30_000);
  return () => window.clearInterval(id);
}
const minuteKey = () => Math.floor(Date.now() / 60_000);
const noKey = () => null;

function useClock() {
  const key = useSyncExternalStore(subscribeMinute, minuteKey, noKey);
  return key === null
    ? null
    : localClock(new Date(key * 60_000), siteConfig.timeZone);
}

/** "Abierto ahora · Cierra a las 18:30", según el horario regular (sin feriados). */
export function OpenStatus() {
  const clock = useClock();
  const status = clock
    ? describeStatus(
        openingStatus(siteConfig.schedule, clock.day, clock.minute),
      )
    : null;
  if (!status) return <span className="inline-block h-9" aria-hidden />;
  const open = status.label === "Abierto ahora";
  return (
    <p className="inline-flex items-center gap-2.5 rounded-full border border-white/12 bg-white/[0.04] py-2 pr-4 pl-3 text-sm">
      <span className="relative flex size-2.5">
        {open ? (
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-[#25d366] opacity-60" />
        ) : null}
        <span
          className={`relative inline-flex size-2.5 rounded-full ${open ? "bg-[#25d366]" : "bg-brand-red"}`}
        />
      </span>
      <span className="font-semibold text-chalk">{status.label}</span>
      <span className="text-mist">· {status.detail}</span>
    </p>
  );
}

// Horario agrupado como lo publica AutoDealer: "Lunes a viernes", "Sábado" y "Domingo".
const GROUPS = [
  ...siteConfig.schedule.map((slot, i) => ({
    label: siteConfig.hours[i]?.days ?? "",
    days: slot.days as readonly number[],
    time: `${slot.open} – ${slot.close}`,
  })),
  { label: "Domingo", days: [0] as readonly number[], time: "Cerrado" },
];

/** Horario compacto: días a la izquierda, horas alineadas a la derecha. */
export function WeekHours() {
  return (
    <dl className="divide-y divide-white/8 border-y border-white/8">
      {GROUPS.map((g) => (
        <div
          key={g.label}
          className="flex items-baseline justify-between gap-6 py-3"
        >
          <dt className="text-chalk/85">{g.label}</dt>
          <dd
            className={`font-semibold tabular-nums ${g.time === "Cerrado" ? "text-mist" : "text-chalk"}`}
          >
            {g.time}
          </dd>
        </div>
      ))}
    </dl>
  );
}
