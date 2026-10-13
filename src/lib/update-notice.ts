export const UPDATE_NOTICE_KEY = "adhkar:update-notice:2026-10-13";
const START = Date.UTC(2026, 9, 13);
const END = START + 7 * 24 * 60 * 60 * 1000;

/** One release notice per installation, only during this release's week. */
export function shouldShowUpdateNotice(now: number, seen: string | null): boolean {
  return now >= START && now < END && seen !== "seen";
}