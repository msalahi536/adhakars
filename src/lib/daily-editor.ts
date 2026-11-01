import { z } from "zod";

export const dailyType = z.enum(["quran_verse", "sunnah"]);
export type DailyType = z.infer<typeof dailyType>;
export const dateKey = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine((s) => {
  const d = new Date(`${s}T00:00:00Z`);
  return Number.isFinite(d.getTime()) && d.toISOString().slice(0, 10) === s;
}, "Choose a valid date");
export const dailyContent = z.object({
  arabic_text: z.string().trim().min(1).max(20000),
  translation: z.string().trim().min(1).max(20000),
  reference: z.string().trim().min(1).max(500),
});
export type DailyContent = z.infer<typeof dailyContent>;
export type DailyAssignment = { date: string; widget_type: DailyType; content: DailyContent };
export function addDays(key: string, days: number) {
  const d = new Date(`${key}T00:00:00Z`); d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}
export function weekDates(key: string) {
  const d = new Date(`${key}T00:00:00Z`);
  const monday = addDays(key, -((d.getUTCDay() + 6) % 7));
  return Array.from({ length: 7 }, (_, i) => addDays(monday, i));
}
export function assignedContent(rows: DailyAssignment[], type: string, key: string) {
  const row = rows.find((r) => r.widget_type === type && r.date === key);
  const parsed = dailyContent.safeParse(row?.content);
  return parsed.success ? parsed.data : null;
}