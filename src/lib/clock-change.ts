/**
 * Finds a daylight-saving clock change between two instants on this device,
 * so the Salah countdown can explain why it differs from simple clock math.
 */
export type ClockChange = { at: Date; shiftMinutes: number };

export function findClockChange(from: Date, to: Date): ClockChange | null {
  const startOffset = from.getTimezoneOffset();
  const endOffset = to.getTimezoneOffset();
  if (startOffset === endOffset || to.getTime() <= from.getTime()) return null;
  let lo = from.getTime();
  let hi = to.getTime();
  while (hi - lo > 1000) {
    const mid = Math.floor((lo + hi) / 2);
    if (new Date(mid).getTimezoneOffset() === startOffset) lo = mid;
    else hi = mid;
  }
  const at = new Date(Math.round(hi / 60_000) * 60_000);
  // Positive shift means clocks go back (PDT -> PST is +60).
  return { at, shiftMinutes: endOffset - startOffset };
}

/** The old clock's reading at the change, e.g. "2:00 AM" when clocks fall back. */
export function clockChangeLabel(change: ClockChange): string {
  const total = (((change.at.getHours() * 60 + change.at.getMinutes() + change.shiftMinutes) % 1440) + 1440) % 1440;
  const hh = Math.floor(total / 60);
  const mm = total % 60;
  const h12 = hh % 12 === 0 ? 12 : hh % 12;
  return `${h12}:${String(mm).padStart(2, "0")} ${hh >= 12 ? "PM" : "AM"}`;
}
