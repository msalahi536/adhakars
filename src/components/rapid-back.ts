export type BackBurst = { last: number; count: number };
/** Three taps with no more than 350ms between taps enter instant navigation. */
export function nextBackBurst(previous: BackBurst, now: number): BackBurst {
  return { last: now, count: now - previous.last <= 350 ? previous.count + 1 : 1 };
}

export type ArrowBurst = BackBurst & { direction: 1 | -1 };
export function nextArrowBurst(previous: ArrowBurst, now: number, direction: 1 | -1): ArrowBurst {
  const burst = nextBackBurst(previous.direction === direction ? previous : { last: -Infinity, count: 0 }, now);
  return { ...burst, direction };
}