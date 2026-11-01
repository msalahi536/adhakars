import type { QuranPage } from "@/lib/hifz";

export function pageRecitationLabel(page: QuranPage, names: Record<number, string>, surahPages: Record<number, [number, number]> = {}): string {
  const spans = new Map<number, number[]>();
  for (const key of page.verseKeys) {
    const [surah, ayah] = key.split(":").map(Number);
    if (!Number.isFinite(surah) || !Number.isFinite(ayah)) continue;
    spans.set(surah, [...(spans.get(surah) ?? []), ayah]);
  }
  const namedSpans = [...spans].map(([surah, ayahs]) => {
    const first = Math.min(...ayahs), last = Math.max(...ayahs);
    return `${names[surah] ?? `Surah ${surah}`} · ${first === last ? `Ayah ${first}` : `Ayahs ${first}–${last}`}`;
  }).join(" / ");
  if (namedSpans) return namedSpans;
  return Object.entries(surahPages).filter(([, [first, last]]) => page.page >= first && page.page <= last)
    .map(([id]) => names[Number(id)] ?? `Surah ${id}`).join(" / ") || `Page ${page.page}`;
}