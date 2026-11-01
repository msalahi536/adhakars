import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { buildReference, check } from "./checker";

test("a short missing ayah-start Allah with recited neighbours is unsure", () => {
  const key = JSON.parse(readFileSync("public/hifz-ai/ayat/112.json", "utf8"));
  const run = JSON.parse(readFileSync("debug/hifz/al-ikhlas-skipped-run-2/debug.json", "utf8"));
  const result = check(buildReference(key, 112, 1, 4), run.heard, true, run.conf);
  expect(result.words.find((word) => word.key === "112:2:1")?.status).toBe("unsure");
});
test("reset threshold is 0.35 seconds", () => {
  const source = readFileSync("src/lib/hifz-ai/recognizer.ts", "utf8");
  expect(Number(source.match(/resetAfterPause = ([\d.]+)/)?.[1])).toBe(0.35);
});