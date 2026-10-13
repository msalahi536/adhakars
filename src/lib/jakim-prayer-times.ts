/** Official JAKIM monthly timetables, resolved to a Malaysian zone by coordinates. */
export type JakimDay = {
  day: number;
  fajr: number;
  syuruk: number;
  dhuhr: number;
  asr: number;
  maghrib: number;
  isha: number;
};

type JakimMonth = { zone: string; year: number; month_number: number; prayers: JakimDay[] };
const pending = new Map<string, Promise<JakimMonth | null>>();

export function parseJakimMonth(value: unknown, year: number, month: number): JakimMonth | null {
  if (!value || typeof value !== "object") return null;
  const data = value as Partial<JakimMonth>;
  if (typeof data.zone !== "string" || !/^[A-Z]{3}\d{2}$/.test(data.zone) || data.year !== year || data.month_number !== month || !Array.isArray(data.prayers)) return null;
  const fields = ["fajr", "syuruk", "dhuhr", "asr", "maghrib", "isha"] as const;
  if (!data.prayers.every((row) => row && Number.isInteger(row.day) && row.day >= 1 && row.day <= 31 && fields.every((field) => typeof row[field] === "number" && Number.isFinite(row[field]) && row[field] > 0))) return null;
  return data as JakimMonth;
}

export async function fetchJakimMonth(date: Date, lat: number, lng: number): Promise<JakimMonth | null> {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const url = `https://api.waktusolat.app/v2/solat/gps/${lat}/${lng}?year=${year}&month=${month}`;
  const existing = pending.get(url);
  if (existing) return existing;
  const request = (async () => {
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(15000) });
      return response.ok ? parseJakimMonth(await response.json(), year, month) : null;
    } catch {
      return null;
    }
  })();
  pending.set(url, request);
  try { return await request; } finally { pending.delete(url); }
}