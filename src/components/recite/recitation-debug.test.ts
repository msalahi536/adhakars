import { test, expect } from "bun:test";
import { unzipSync, strFromU8 } from "fflate";
import { debugEnabled, debugZip, RECITATION_DEBUG_KEY } from "./recitation-debug";
import type { CheckResult } from "@/lib/hifz-ai/checker";
test("debug recording is off by default even with beta enabled", () => {
  expect(debugEnabled({ getItem: (key) => key === "hifz_beta" ? "1" : null })).toBe(false);
});
test("debug recording is hidden outside beta even with saved opt-in", () => {
  expect(debugEnabled({ getItem: (key) => key === RECITATION_DEBUG_KEY ? "1" : "0" })).toBe(false);
  expect(debugEnabled({ getItem: () => "1" })).toBe(true);
});
test("one ZIP contains raw audio and exact word/phoneme/confidence diagnostics", async () => {
  const result: CheckResult = { startKey: "112:2:1", startIndex: 0, reachedIndex: 5, heard: "لَاهُ", conf: [.7, .8], extras: [{ atKey: "112:2:1", heard: "ه", kind: "extra" }], words: [{ key: "112:2:1", text: "ٱللَّهُ", status: "wrong", expected: "ءَلَاهُ", heard: "لَاهُ" }] };
  const file = await debugZip(new Blob(["raw audio"], { type: "audio/mp4" }), [{ sura: 112, first: 1, last: 4 }], result, "test browser");
  const entries = unzipSync(new Uint8Array(await file.arrayBuffer()));
  expect(strFromU8(entries["recording.m4a"])).toBe("raw audio");
  const document = JSON.parse(strFromU8(entries["debug.json"]));
  expect(document.heard).toBe("لَاهُ"); expect(document.conf).toEqual([.7, .8]);
  expect(document.words).toEqual(result.words); expect(document.extras).toEqual(result.extras);
  expect(document.ayahRange).toEqual([{ surah: 112, first: 1, last: 4 }]);
  expect(document.startKey).toBe("112:2:1");
});