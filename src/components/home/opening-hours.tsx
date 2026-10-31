"use client";

import { useSyncExternalStore } from "react";
import { siteConfig } from "@/config/site";
import { describeStatus, localClock, openingStatus } from "@/lib/utils/opening-hours";

// Reloj por minuto. En el servidor no hay hora: el estado aparece al hidratar.
function subscribeMinute(cb: () => void) {
  const id = window.setInterval(cb, 30_000);
  return () => window.clearInterval(id);
}
const minuteKey = () => Math.floor(Date.now() / 60_000);
const noKey = () => null;

function useClock() {
  const key = useSyncExternalStore(subscribeMinute, minuteKey, noKey);
  return key === null ? null : localClock(new Date(key * 60_000), siteConfig.timeZone);
}

/** "Abierto ahora · Cierra a las 18:30", según el horario regular (sin feriados). */
export function OpenStatus() {
  const clock = useClock();
  const status = clock ? describeStatus(openingStatus(siteConfig.schedule, clock.day, clock.minute)) : null;
  if (!status) return <span className="inline-block h-9" aria-hidden />;
  const open = status.label === "Abierto ahora";
  return (
    <p className="inline-flex items-center gap-2.5 rounded-full border border-white/12 bg-white/[0.04] py-2 pr-4 pl-3 text-sm">
      <span className="relative flex size-2.5">
        {open ? <span className="absolute inline-flex size-full animate-ping rounded-full bg-[#25d366] opacity-60" /> : null}
        <span className={`relative inline-flex size-2.5 rounded-full ${open ? "bg-[#25d366]" : "bg-brand-red"}`} />
      </span>
      <span className="font-semibold text-chalk">{status.label}</span>
      <span className="text-mist">· {status.detail}</span>
    </p>
  );
}

const WEEK = [1, 2, 3, 4, 5, 6, 0];
const SHORT = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

/** Horario día por día con el día de hoy destacado. */
export function WeekHours() {
  const clock = useClock();
  return (
    <ul className="divide-y divide-white/6 text-sm">
      {WEEK.map((d) => {
        const slot = siteConfig.schedule.find((s) => (s.days as readonly number[]).includes(d));
        const today = clock?.day === d;
        return (
          <li key={d} className={`flex items-center justify-between gap-4 py-2 ${today ? "text-chalk" : "text-mist"}`}>
            <span className={`flex items-center gap-2 ${today ? "font-semibold" : ""}`}>
              {SHORT[d]}
              {today ? <span className="rounded-sm bg-brand-yellow px-1.5 py-px text-[0.65rem] font-bold tracking-wider text-ink uppercase">Hoy</span> : null}
            </span>
            <span className={`tabular-nums ${today ? "font-semibold" : ""}`}>{slot ? `${slot.open} – ${slot.close}` : "Cerrado"}</span>
          </li>
        );
      })}
    </ul>
  );
}
