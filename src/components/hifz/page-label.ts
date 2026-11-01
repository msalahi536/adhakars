import type { QuranPage } from "@/lib/hifz";

export function pageRecitationLabel(page: QuranPage, names: Record<number, string>): string {
  const spans = new Map<number, number[]>();
  for (const key of page.verseKeys) {
    const [surah, ayah] = key.split(":").map(Number);
    if (!Number.isFinite(surah) || !Number.isFinite(ayah)) continue;
    spans.set(surah, [...(spans.get(surah) ?? []), ayah]);
  }
  return [...spans].map(([surah, ayahs]) => {
    const first = Math.min(...ayahs), last = Math.max(...ayahs);
    return `${names[surah] ?? `Surah ${surah}`} · ${first === last ? `Ayah ${first}` : `Ayahs ${first}–${last}`}`;
  }).join(" / ") || `Page ${page.page}`;
}