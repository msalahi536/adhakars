import { describe, expect, it } from "bun:test";
import { compareWords, normalizeArabic } from "./voice-lab";

describe("voice lab comparison", () => {
  it("ignores harakat", () => {
    expect(normalizeArabic("قُلْ هُوَ ٱللَّهُ أَحَدٌ")).toBe("قل هو الله احد");
  });
  it("marks a skipped word as missed", () => {
    const r = compareWords("قُلْ هُوَ ٱللَّهُ أَحَدٌ", "قل الله احد");
    expect(r.words.map((w) => w.status)).toEqual(["ok", "missed", "ok", "ok"]);
    expect(r.accuracy).toBe(0.75);
  });
  it("collects extra heard words", () => {
    expect(compareWords("الله احد", "الله الصمد احد").extra).toEqual(["الصمد"]);
  });
});
