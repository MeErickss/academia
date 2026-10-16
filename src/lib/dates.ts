export const WEEKDAYS = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
export const WEEKDAYS_SHORT = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
export const WEEKDAYS_LETTER = ["D", "S", "T", "Q", "Q", "S", "S"];
export const MONTHS = [
  "janeiro",
  "fevereiro",
  "março",
  "abril",
  "maio",
  "junho",
  "julho",
  "agosto",
  "setembro",
  "outubro",
  "novembro",
  "dezembro",
];

const pad = (n: number) => String(n).padStart(2, "0");

/** Data local no formato AAAA-MM-DD (sem fuso bagunçando). */
export function dayKey(d: Date | number = new Date()) {
  const x = typeof d === "number" ? new Date(d) : d;
  return `${x.getFullYear()}-${pad(x.getMonth() + 1)}-${pad(x.getDate())}`;
}

export function parseDayKey(key: string) {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function startOfDay(d: Date | number = new Date()) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

/** Segunda-feira da semana de `d`. */
export function startOfWeek(d: Date | number = new Date()) {
  const x = startOfDay(d);
  const diff = (x.getDay() + 6) % 7;
  x.setDate(x.getDate() - diff);
  return x;
}

export function addDays(d: Date, days: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + days);
  return x;
}

export function formatDate(d: Date | number | string, withYear = false) {
  const x = typeof d === "string" ? parseDayKey(d) : new Date(d);
  const base = `${x.getDate()} de ${MONTHS[x.getMonth()]}`;
  return withYear ? `${base} de ${x.getFullYear()}` : base;
}

export function formatShortDate(d: Date | number | string) {
  const x = typeof d === "string" ? parseDayKey(d) : new Date(d);
  return `${pad(x.getDate())}/${pad(x.getMonth() + 1)}`;
}

export function formatTime(d: Date | number) {
  const x = new Date(d);
  return `${pad(x.getHours())}:${pad(x.getMinutes())}`;
}

export function formatDuration(ms: number) {
  if (ms <= 0) return "0 min";
  if (ms < 60000) return "< 1 min";
  const totalMin = Math.round(ms / 60000);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (h === 0) return `${m} min`;
  return `${h}h${m ? pad(m) : ""}`;
}

export function formatClock(totalSec: number) {
  const s = Math.max(0, Math.round(totalSec));
  const m = Math.floor(s / 60);
  return `${m}:${pad(s % 60)}`;
}

export function daysBetween(a: Date | number, b: Date | number) {
  return Math.round((startOfDay(b).getTime() - startOfDay(a).getTime()) / 86400000);
}

export function relativeDay(ts: number, now = Date.now()) {
  const diff = daysBetween(ts, now);
  if (diff <= 0) return "hoje";
  if (diff === 1) return "ontem";
  if (diff < 7) return `há ${diff} dias`;
  if (diff < 14) return "semana passada";
  if (diff < 60) return `há ${Math.round(diff / 7)} semanas`;
  return `há ${Math.round(diff / 30)} meses`;
}

export function greeting(now = new Date()) {
  const h = now.getHours();
  if (h < 5) return "Boa noite";
  if (h < 12) return "Bom dia";
  if (h < 18) return "Boa tarde";
  return "Boa noite";
}
