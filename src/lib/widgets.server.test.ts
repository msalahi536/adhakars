import { expect, test } from "bun:test";
import { pickIndex, type ContentRow } from "./widgets.server";

const items: ContentRow[] = Array.from({ length: 5 }, (_, index) => ({
  id: `content-${index}`, category: "quran_verse", arabic_text: "test",
  translation: "test", transliteration: null, reference: null, reward_note: null,
  is_active: true, display_order: index,
}));

for (const widgetType of ["quran_verse", "name_of_allah"]) {
  test(`${widgetType} sequential rotation changes at UTC midnight and repeats after five entries`, () => {
    const index = (date: string) => pickIndex(items, "sequential", null, widgetType, new Date(date));
    expect(index("2026-10-08T00:00:00Z")).toBe(1);
    expect(index("2026-10-08T23:59:59Z")).toBe(1);
    expect(index("2026-10-09T00:00:00Z")).toBe(2);
    expect(index("2026-10-13T00:00:00Z")).toBe(1);
  });
}