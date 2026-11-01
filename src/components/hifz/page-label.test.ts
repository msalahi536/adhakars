import { expect, test } from "bun:test";
import { pageRecitationLabel } from "./page-label";

test("a page shows named surahs and only its actual ayah spans", () => {
  expect(pageRecitationLabel({ page: 604, juz: 30, lines: 15, surahStarts: [112, 113, 114], verseKeys: ["112:1", "112:4", "113:1", "113:5", "114:1", "114:6"] }, { 112: "Al-Ikhlas", 113: "Al-Falaq", 114: "An-Nas" })).toBe("Al-Ikhlas · Ayahs 1–4 / Al-Falaq · Ayahs 1–5 / An-Nas · Ayahs 1–6");
});

test("the planning index without verse keys still identifies all surahs on page 604", () => {
  expect(pageRecitationLabel({ page: 604, juz: 30, lines: 15, surahStarts: [], verseKeys: [] }, { 112: "Al-Ikhlas", 113: "Al-Falaq", 114: "An-Nas" }, { 112: [604, 604], 113: [604, 604], 114: [604, 604] })).toBe("Al-Ikhlas / Al-Falaq / An-Nas");
});