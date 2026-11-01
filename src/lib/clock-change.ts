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
  // Narrow to the minute where the device's UTC offset flips.
  while (hi - lo > 60_000) {
    const mid = Math.floor((lo + hi) / 2);
    if (new Date(mid).getTimezoneOffset() === startOffset) lo = mid;
    else hi = mid;
  }
  // Positive shift means clocks go back (e.g. PDT -> PST is +60).
  return { at: new Date(hi), shiftMinutes: endOffset - startOffset };
}

/** Wall-clock time just before the change, e.g. "2:00 AM". */
export function clockChangeLabel(change: ClockChange): string {
  const before = new Date(change.at.getTime() - change.shiftMinutes * 60_000 * 0 - 1);
  const rounded = new Date(Math.ceil(before.getTime() / 60_000) * 60_000);
  // Show the time as it read on the old clock.
  const oldClock = new Date(rounded.getTime());
  const h = oldClock.getHours();
  const m = oldClock.getMinutes();
  // getHours on the change instant already reports the new clock, so derive
  // the old-clock reading by adding back the shift.
  const total = (h * 60 + m + change.shiftMinutes + 1440) % 1440;
  const hh = Math.floor(total / 60);
  const mm = total % 60;
  const suffix = hh >= 12 ? "PM" : "AM";
  const h12 = hh % 12 === 0 ? 12 : hh % 12;
  return `${h12}:${String(mm).padStart(2, "0")} ${suffix}`;
}
