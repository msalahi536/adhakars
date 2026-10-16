export const UPDATE_NOTICE_KEY = "adhkar:update-notice:2026-10-16-quran";
const START = Date.UTC(2026, 9, 16);
const END = START + 7 * 24 * 60 * 60 * 1000;

/** One release notice per installation, only during this release's week. */
export function shouldShowUpdateNotice(now: number, seen: string | null): boolean {
  return now >= START && now < END && seen !== "seen";
}

/** The Quran launch hint in the tab bar retires with the release notice on Oct 23, 2026. */
export function isQuranLaunchWindow(now: number): boolean {
  return now < END;
}
