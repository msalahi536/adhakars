import { expect, test } from "bun:test";
import { readRecite } from "./model";
test("previously enabled Sounds stay disabled without losing progress", () => {
  const previous = Object.getOwnPropertyDescriptor(globalThis, "localStorage");
  Object.defineProperty(globalThis, "localStorage", { configurable: true, value: { getItem: () => JSON.stringify({ page:567, settings:{sounds:true,haptics:false},marks:{"67:1:1":"correct"} }) } });
  try {
    const saved=readRecite(); expect(saved.settings.sounds).toBe(false); expect(saved.settings.haptics).toBe(false);
    expect(saved.page).toBe(567); expect(saved.marks["67:1:1"]).toBe("correct");
  } finally { if(previous) Object.defineProperty(globalThis,"localStorage",previous); else Reflect.deleteProperty(globalThis,"localStorage"); }
});
