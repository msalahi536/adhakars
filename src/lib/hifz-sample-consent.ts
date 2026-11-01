export type SampleConsent = { enabled: boolean; adult: boolean; date: string | null };
export const SAMPLE_CONSENT_KEY = "hifz_sample_consent_v1";
export const NO_SAMPLE_CONSENT: SampleConsent = { enabled: false, adult: false, date: null };
export function makeSampleConsent(adult: boolean, date = new Date().toISOString()): SampleConsent {
  return adult ? { enabled: true, adult: true, date } : { ...NO_SAMPLE_CONSENT };
}
export function readSampleConsent(): SampleConsent {
  try { const c = JSON.parse(localStorage.getItem(SAMPLE_CONSENT_KEY) ?? "null"); return c?.enabled === true && c?.adult === true && typeof c.date === "string" && Number.isFinite(Date.parse(c.date)) ? c : { ...NO_SAMPLE_CONSENT }; } catch { return { ...NO_SAMPLE_CONSENT }; }
}
export function saveSampleConsent(c: SampleConsent) { localStorage.setItem(SAMPLE_CONSENT_KEY, JSON.stringify(c)); }
export function canReport(c: SampleConsent) { return c.enabled && c.adult && !!c.date; }