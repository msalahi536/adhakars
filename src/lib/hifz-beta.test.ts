import { expect, test } from "bun:test";
import { createHifzBetaTapCounter, HIFZ_BETA_KEY, readHifzBeta, toggleHifzBeta, joinHifzBeta, setHifzBeta } from "./hifz-beta";

const store = (value?: string) => {
  const values = new Map<string,string>([["quran-recitation:v1", "saved-progress"]]);
  if (value !== undefined) values.set(HIFZ_BETA_KEY,value);
  return { getItem: (key: string) => values.get(key) ?? null, setItem: (key: string,value: string) => { values.set(key,value); } };
};
test("Hifz hidden by default and only exact 1 enables it", () => {
  for (const value of [undefined,"0","true","01","","2"]) expect(readHifzBeta(store(value))).toBe(false);
  expect(readHifzBeta(store("1"))).toBe(true);
});
test("seven version taps toggle on; next seven toggle off, preserving progress", () => {
  const storage=store(); const tap=createHifzBetaTapCounter(() => { toggleHifzBeta(storage); });
  for(let i=0;i<6;i++) tap(); expect(readHifzBeta(storage)).toBe(false);
  tap(); expect(storage.getItem("hifz_beta")).toBe("1");
  for(let i=0;i<6;i++) tap(); expect(readHifzBeta(storage)).toBe(true);
  tap(); expect(readHifzBeta(storage)).toBe(false);
  expect(storage.getItem("quran-recitation:v1")).toBe("saved-progress");
});
test("unavailable storage keeps Hifz hidden", () => {
  const storage={getItem:()=>{throw new Error("blocked");},setItem:()=>{throw new Error("blocked");}};
  expect(readHifzBeta(storage)).toBe(false); expect(toggleHifzBeta(storage)).toBe(false);
});
test("HIFZBETA joins beta and leaving preserves progress", () => { const s = store(); expect(joinHifzBeta("wrong", s)).toBe(false); expect(readHifzBeta(s)).toBe(false); expect(joinHifzBeta("HIFZBETA", s)).toBe(true); expect(s.getItem("hifz_beta")).toBe("1"); setHifzBeta(false, s); expect(readHifzBeta(s)).toBe(false); expect(s.getItem("quran-recitation:v1")).toBe("saved-progress"); });