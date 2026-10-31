/** Horario semanal: días (0 = domingo … 6 = sábado) con apertura y cierre "HH:MM". */
export type WeeklySchedule = readonly { days: readonly number[]; open: string; close: string }[];

export type OpeningStatus =
  | { open: true; closesAt: string }
  | { open: false; opensAt: string; opensDay: number; today: boolean; tomorrow: boolean }
  | null;

const minutes = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
};

/** Día de la semana y minutos del día en la zona horaria del local. */
export function localClock(date: Date, timeZone: string): { day: number; minute: number } {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone, weekday: "short", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(date);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  const day = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(get("weekday"));
  return { day, minute: Number(get("hour")) * 60 + Number(get("minute")) };
}

/** ¿Está abierto? Si no, cuándo abre. No considera feriados (horario regular). */
export function openingStatus(schedule: WeeklySchedule, day: number, minute: number): OpeningStatus {
  const slotsFor = (d: number) => schedule.filter((s) => s.days.includes(d)).sort((a, b) => minutes(a.open) - minutes(b.open));
  const now = slotsFor(day).find((s) => minute >= minutes(s.open) && minute < minutes(s.close));
  if (now) return { open: true, closesAt: now.close };
  for (let offset = 0; offset < 7; offset++) {
    const d = (day + offset) % 7;
    const next = slotsFor(d).find((s) => offset > 0 || minutes(s.open) > minute);
    if (next) return { open: false, opensAt: next.open, opensDay: d, today: offset === 0, tomorrow: offset === 1 };
  }
  return null;
}

const DAY_NAMES = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];

/** "Abierto ahora · cierra a las 18:30" / "Cerrado · abre mañana a las 08:30". */
export function describeStatus(status: OpeningStatus): { label: string; detail: string } | null {
  if (!status) return null;
  if (status.open) return { label: "Abierto ahora", detail: `Cierra a las ${status.closesAt}` };
  const when = status.today ? "hoy" : status.tomorrow ? "mañana" : `el ${DAY_NAMES[status.opensDay]}`;
  return { label: "Cerrado", detail: `Abre ${when} a las ${status.opensAt}` };
}
