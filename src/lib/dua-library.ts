import raw from "@/data/dua-library.json";

export type Dua = {
  id: string; cat: string; title: string; src: string; ref: string; tsrc: string;
  ar: string; tr: string; en: string; kw: string[]; note?: string;
};

export const DUAS = raw as Dua[];

export const CATEGORIES = [
  "Anxiety, sadness & depression", "Distress & hardship", "Debt, work & provision",
  "Fear, enemies & protection", "Sin, repentance & doubt", "Health, illness & pain",
  "Grief, death & calamity", "Decisions & guidance", "Daily life & home", "Prayer & worship",
  "Family, marriage & children", "Weather & nature", "Social & occasions",
];

export const EMOTIONAL_CATS = new Set(CATEGORIES.slice(0, 2).concat("Grief, death & calamity"));

export function sourceLabel(src: string) {
  const [k, n] = src.split(":");
  const names: Record<string, string> = { hisn: "Hisn al-Muslim", bukhari: "Bukhari", muslim: "Muslim", abudawud: "Abu Dawud", tirmidhi: "Tirmidhi", nasai: "Nasa'i", ibnmajah: "Ibn Majah", quran: "Qur'an", adab: "Al-Adab al-Mufrad", malik: "Muwatta Malik" };
  const name = names[k] ?? k.charAt(0).toUpperCase() + k.slice(1);
  return n ? `${name} ${n}` : name;
}

export function searchDuas(q: string): Dua[] {
  const s = q.trim().toLowerCase();
  if (!s) return [];
  const scored: { d: Dua; score: number }[] = [];
  for (const d of DUAS) {
    let score = 0;
    if (d.kw.some((k) => k.toLowerCase().includes(s))) score = 4;
    else if (d.title.toLowerCase().includes(s)) score = 3;
    else if (d.cat.toLowerCase().includes(s)) score = 2;
    else if (d.en.toLowerCase().includes(s)) score = 1;
    if (score) scored.push({ d, score });
  }
  return scored.sort((a, b) => b.score - a.score).map((x) => x.d);
}

const K = "adhkar:dua-favs";
export type Fav = { id: string; at: number };
export function getFavs(): Fav[] {
  try { return JSON.parse(localStorage.getItem(K) || "[]"); } catch { return []; }
}
export function setFavs(f: Fav[]) { localStorage.setItem(K, JSON.stringify(f)); }
