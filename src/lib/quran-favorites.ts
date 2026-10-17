import { useEffect, useState } from "react";

const KEY = "adhkar:quran:favorite-reciters";
const EVENT = "adhkar:quran-favorites";

export function readFavorites(): number[] {
  try {
    const v = JSON.parse(window.localStorage.getItem(KEY) || "[]");
    return Array.isArray(v) ? v.filter((n) => typeof n === "number") : [];
  } catch {
    return [];
  }
}

/** Newest favorite first. */
export function toggleFavorite(id: number): number[] {
  const cur = readFavorites();
  const next = cur.includes(id) ? cur.filter((x) => x !== id) : [id, ...cur];
  try { window.localStorage.setItem(KEY, JSON.stringify(next)); } catch { /* ignore */ }
  window.dispatchEvent(new Event(EVENT));
  return next;
}

/** Favorites go first, keeping the rest in their existing order. */
export function favoritesFirst<T extends { id: number }>(list: T[], favs: number[]): T[] {
  const rank = new Map(favs.map((id, i) => [id, i]));
  return [...list.filter((r) => rank.has(r.id)).sort((a, b) => rank.get(a.id)! - rank.get(b.id)!), ...list.filter((r) => !rank.has(r.id))];
}

export function useFavoriteReciters() {
  const [favs, setFavs] = useState<number[]>([]);
  useEffect(() => {
    const on = () => setFavs(readFavorites());
    on();
    window.addEventListener(EVENT, on);
    return () => window.removeEventListener(EVENT, on);
  }, []);
  return favs;
}
