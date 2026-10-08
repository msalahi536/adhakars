// Every card that shows a recitation button, grouped for the admin page.
import { morningAdhkar, eveningAdhkar } from "./adhkar";
import { sleepItems, wakeItems } from "./sleep";
import { DUAS, CATEGORIES } from "@/lib/dua-library";
import { SALAH_PRAYERS, getSalahItems, type SalahItem } from "./salah";

export type RecitationCard = { id: string; title: string };
export type RecitationGroup = { label: string; cards: RecitationCard[] };

const fromItems = (items: SalahItem[]) =>
  items.flatMap((i) => (i.dhikr ? [{ id: i.dhikr.id, title: i.dhikr.title }] : []));

export function getRecitationGroups(): RecitationGroup[] {
  const seen = new Set<string>();
  const uniq = (cards: RecitationCard[]) =>
    cards.filter((c) => (seen.has(c.id) ? false : (seen.add(c.id), true)));
  return [
    { label: "Morning Adhkar", cards: uniq(morningAdhkar.map((d) => ({ id: d.id, title: d.title }))) },
    { label: "Evening Adhkar", cards: uniq(eveningAdhkar.map((d) => ({ id: d.id, title: d.title }))) },
    { label: "Sleep", cards: uniq(fromItems(sleepItems)) },
    { label: "Waking Up", cards: uniq(fromItems(wakeItems)) },
    ...SALAH_PRAYERS.map((p) => ({ label: `After ${p.label}`, cards: uniq(fromItems(getSalahItems(p.id))) })),
    // Ruqyah reuses the morning/evening verse ids, so those share one recording.
    { label: "Ruqyah", cards: [
      { id: "ruqyah-al-fatihah", title: "Surat al-Fatihah" },
      { id: "morning-1-ayat-al-kursi", title: "Ayat al-Kursi (shared with morning)" },
      { id: "evening-19-the-last-two-verses-of-surat-al-baqa", title: "Last two verses of al-Baqarah (shared with evening)" },
      { id: "morning-2-three-quls", title: "The three Quls (shared with morning)" },
      { id: "morning-9-bismillahi-lladhi-la-ya-urru-maa-smi", title: "Bismillahi lladhi la yadurru (shared with morning)" },
      { id: "evening-17-audhu-bi-kalimati-llahi-t-tammati-mi", title: "A'udhu bi-kalimati llahi t-tammat (shared with evening)" },
    ] },
    ...CATEGORIES.map((c) => ({ label: `Dua Library · ${c}`, cards: DUAS.filter((d) => d.cat === c).map((d) => ({ id: `dua-${d.id}`, title: d.title })) })),
  ].filter((g) => g.cards.length);
}
