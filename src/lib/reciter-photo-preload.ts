import { HOME_RECITER_IDS, POPULAR_RECITERS, RECITERS, reciterHasPhoto, reciterPhoto } from "@/lib/quran";

/**
 * Reciter portraits load one-by-one while the All Reciters list is scrolled, so
 * avatars sit empty until each file arrives. This module warms the browser cache
 * in the background — most-used reciters first — after the app has gone idle.
 * It never runs on a metered connection or a very slow network.
 */
const CONCURRENCY = 3;
let started = false;

type SlowConnection = { saveData?: boolean; effectiveType?: string };

const connection = (): SlowConnection | undefined =>
  (navigator as Navigator & { connection?: SlowConnection }).connection;

const warm = (url: string) =>
  new Promise<void>((resolve) => {
    const img = new Image();
    img.decoding = "async";
    img.fetchPriority = "low";
    img.onload = () => resolve();
    img.onerror = () => resolve();
    img.src = url;
  });

/** Portrait urls in the order they should be cached: home strip, popular, then everyone else. */
export function reciterPhotoQueue(): string[] {
  const ordered: string[] = [];
  const seen = new Set<string>();
  const push = (id: number) => {
    const r = RECITERS.find((x) => x.id === id);
    const url = r ? reciterPhoto(r) : null;
    if (url && !seen.has(url)) {
      seen.add(url);
      ordered.push(url);
    }
  };
  HOME_RECITER_IDS.forEach(push);
  POPULAR_RECITERS.forEach(push);
  for (const r of RECITERS) {
    if (!reciterHasPhoto(r)) continue;
    const url = reciterPhoto(r);
    if (url && !seen.has(url)) {
      seen.add(url);
      ordered.push(url);
    }
  }
  return ordered;
}

export function preloadReciterPhotos() {
  if (started || typeof window === "undefined") return;
  started = true;
  const conn = connection();
  if (conn?.saveData || /2g/.test(conn?.effectiveType ?? "")) return;

  const urls = reciterPhotoQueue();
  let next = 0;
  const worker = async () => {
    while (next < urls.length) await warm(urls[next++]);
  };
  void Promise.all(Array.from({ length: CONCURRENCY }, worker));
}

/** Wait until the app is idle so portraits never compete with the first screen. */
export function scheduleReciterPhotoPreload() {
  if (typeof window === "undefined") return;
  const go = () => preloadReciterPhotos();
  if ("requestIdleCallback" in window) {
    window.requestIdleCallback(go, { timeout: 5000 });
  } else {
    window.setTimeout(go, 1500);
  }
}
