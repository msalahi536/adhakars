// Pure Arabic Companion review intervals and local calendar helpers.
export type Grade = "blank" | "mistake" | "hesitation" | "perfect";
export const FIRST_INTERVAL = 1;

export function localDay(d: Date): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export function addDays(day: string, n: number): string {
  const d = new Date(day + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

function daysBetween(from: string, to: string): number {
  return Math.round((Date.parse(to + "T00:00:00Z") - Date.parse(from + "T00:00:00Z")) / 86400000);
}

export function reviewInterval(current: number, due: string, grade: Grade, day: string): number {
  if (grade === "blank") return 1;
  if (grade === "mistake") return Math.max(1, Math.round(current * 0.5));
  if (day >= due) return grade === "perfect" ? current * 2 : Math.ceil(current * 1.2);
  const elapsed = Math.max(0, daysBetween(addDays(due, -current), day));
  return grade === "perfect" ? Math.max(current, elapsed * 2) : Math.max(current, Math.ceil(elapsed * 1.2));
}