// Every card that shows a recitation button, grouped for the admin page.
import { morningAdhkar, eveningAdhkar } from "./adhkar";
import { sleepItems, wakeItems } from "./sleep";
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
  ].filter((g) => g.cards.length);
}
