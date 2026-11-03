import { expect, test } from "bun:test";
import { unzipSync, strFromU8 } from "fflate";
import { debugEnabled, debugZip } from "./hifz-debug";
import type { CheckResult } from "./hifz-ai";
test("test recording requires the seven-tap beta flag as well as its toggle", () => {
  const storage = (beta: string, debug: string) => ({ getItem: (key: string) => key === "hifz_beta" ? beta : debug });
  expect(debugEnabled(storage("0", "1"))).toBe(false);
  expect(debugEnabled(storage("1", "0"))).toBe(false);
  expect(debugEnabled(storage("1", "1"))).toBe(true);
});
test("test ZIP retains recording bytes and raw output with exact timing", async () => {
  const result: CheckResult = { heard: "abc", times: [0.1, 0.4, 1.2], conf: [0.8, 0.9, 1], words: [], extras: [], reachedIndex: -1, startIndex: 0, startKey: "112:1:1" };
  const zip = await debugZip(new Blob([new Uint8Array([1, 2, 3])], { type: "audio/webm" }), result, [{ sura: 112, first: 1, last: 4 }], [{ elapsed: 1.5, result }]);
  const files = unzipSync(new Uint8Array(await zip.arrayBuffer()));
  expect(Array.from(files["recording.webm"] ?? [])).toEqual([1, 2, 3]);
  const doc = JSON.parse(strFromU8(files["debug.json"] ?? new Uint8Array()));
  expect(doc.result.times).toEqual([0.1, 0.4, 1.2]);
  expect(doc.result.heard).toBe("abc");
  expect(doc.updates[0].elapsed).toBe(1.5);
});