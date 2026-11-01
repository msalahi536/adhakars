import { describe, expect, test } from "bun:test";
import { createHifzFeedback, type HifzEvent } from "./hifzHaptics";
import { DEFAULT_SETTINGS } from "./recite/model";

function rig(available = true, fails = false) {
  let time = 0, id = 0;
  const tasks = new Map<number, { at: number; fn: () => void }>();
  const steps: { at: number; value: string }[] = [], sounds: string[] = [], pulses: string[] = [];
  const feedback = createHifzFeedback({
    now: () => time,
    schedule: (fn, delay) => { const key = ++id; tasks.set(key, { at: time + delay, fn }); return key as unknown as ReturnType<typeof setTimeout>; },
    clear: (key) => { tasks.delete(key as unknown as number); },
    available: () => available,
    step: async (value) => { if (fails) throw new Error("No motor"); steps.push({ at: time, value }); },
    pulse: (event) => { pulses.push(event); }, sound: (event) => { sounds.push(event); }, stopSound: () => {},
  });
  const advance = (amount: number) => {
    const end = time + amount;
    while (true) {
      const next = [...tasks.entries()].filter(([,task]) => task.at <= end).sort((a,b) => a[1].at-b[1].at)[0];
      if (!next) break;
      const [key,task] = next; tasks.delete(key); time = task.at; task.fn();
    }
    time = end;
  };
  return { ...feedback, steps, sounds, pulses, advance };
}
const expected: [HifzEvent, string[], number[]][] = [
  ["reveal", ["selection"], [0]], ["wrong", ["Heavy", "Heavy"], [0,70]],
  ["skip", ["Heavy", "Light"], [0,70]], ["small", ["Medium"], [0]], ["unsure", ["Light"], [0]],
  ["drift", ["Heavy", "Heavy", "Heavy"], [0,60,120]], ["ayahComplete", ["Light", "Medium"], [0,90]],
  ["pageComplete", ["Success"], [0]], ["sessionComplete", ["Success", "Heavy"], [0,300]],
  ["milestone", ["Light", "Medium", "Heavy", "Success"], [0,110,220,330]],
  ["micStart", ["Medium"], [0]], ["micStop", ["Light"], [0]], ["pageTurn", ["selection"], [0]],
];
describe("Hifz haptic language", () => {
  for (const [event, values, times] of expected) test(`${event} pattern and exact timing`, () => {
    const r = rig(); r.play(event); r.advance(400);
    expect(r.steps).toEqual(values.map((value,i) => ({ value, at: times[i] })));
  });
  test("mistake priority wrong > skip > drift > small > unsure", () => {
    for (const winner of ["wrong","skip","drift","small","unsure"] as const) {
      const r = rig(); const list = ["unsure","small","drift","skip","wrong"] as const;
      for (const event of list.slice(0,list.indexOf(winner)+1)) r.play(event);
      r.advance(400);
      const pattern = expected.find(([event]) => event === winner);
      expect(r.steps.map(s => s.value)).toEqual(pattern?.[1]);
    }
  });
  test("mistakes suppressed for 1500ms, accepted at boundary", () => {
    const r=rig(); r.play("wrong"); r.advance(1499); r.play("skip"); r.advance(0);
    expect(r.steps.map(s=>s.value)).toEqual(["Heavy","Heavy"]);
    r.advance(1); r.play("skip"); r.advance(70);
    expect(r.steps.slice(2)).toEqual([{at:1500,value:"Heavy"},{at:1570,value:"Light"}]);
  });
  test("new pattern cancels pending steps", () => {
    const r=rig(); r.play("milestone"); r.advance(50); r.play("micStop"); r.advance(500);
    expect(r.steps).toEqual([{at:0,value:"Light"},{at:50,value:"Light"}]);
  });
  test("cancel prevents pending mistake and pattern timers", () => {
    const r=rig(); r.play("wrong"); r.cancel(); r.advance(400); expect(r.steps).toEqual([]);
    r.play("sessionComplete"); r.cancel(); r.advance(400); expect(r.steps).toEqual([{at:400,value:"Success"}]);
  });
  test("Haptics on and Sounds off by default", () => {
    expect(DEFAULT_SETTINGS.haptics).toBe(true); expect(DEFAULT_SETTINGS.sounds).toBe(false);
    const r=rig(); r.play("reveal"); expect(r.steps).toHaveLength(1); expect(r.sounds).toEqual([]);
  });
  test("Sounds adds matching effect independently of Haptics", () => {
    const r=rig(); r.configure({sounds:true}); r.play("reveal"); expect(r.sounds).toEqual(["reveal"]); expect(r.steps).toHaveLength(1);
    r.configure({haptics:false}); r.play("micStop"); expect(r.sounds).toEqual(["reveal","micStop"]); expect(r.steps).toHaveLength(1);
  });
  test("unavailable hardware pulses strip once, not each step", () => {
    const r=rig(false); r.play("milestone"); r.advance(400); expect(r.pulses).toEqual(["milestone"]); expect(r.steps).toEqual([]);
    r.configure({haptics:false}); r.play("reveal"); expect(r.pulses).toEqual(["milestone"]);
  });
  test("native rejection cancels pattern and pulses once", async () => {
    const r=rig(true,true); r.play("milestone"); await Promise.resolve(); await Promise.resolve(); r.advance(400);
    expect(r.pulses).toEqual(["milestone"]); expect(r.steps).toEqual([]);
  });
});
