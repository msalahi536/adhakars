export type BackBurst = { last: number; count: number };
/** Three taps with no more than 350ms between taps enter instant navigation. */
export function nextBackBurst(previous: BackBurst, now: number): BackBurst {
  return { last: now, count: now - previous.last <= 350 ? previous.count + 1 : 1 };
}