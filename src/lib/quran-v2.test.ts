import { test, expect } from "bun:test";
import { createVersionTapCounter, readQuranV2, toggleQuranV2 } from "./quran-v2";
test("only exact quran_v2=1 enables the new screens", () => {
  for (const value of [null,"0","true","01"]) expect(readQuranV2({getItem:()=>value})).toBe(false);
  expect(readQuranV2({getItem:()=>"1"})).toBe(true);
});
test("seven taps toggle Hifz and continuing to ten also toggles Quran", () => {
  let h=0,q=0; const tap=createVersionTapCounter(()=>h++,()=>q++,()=>100);
  for(let i=0;i<6;i++)tap(); expect(h).toBe(0);expect(q).toBe(0);
  tap();expect(h).toBe(1);expect(q).toBe(0);
  tap();tap();expect(q).toBe(0);tap();expect(q).toBe(1);
  for(let i=0;i<10;i++)tap();expect(h).toBe(2);expect(q).toBe(2);
});
test("a separated seven-tap sequence continues to toggle Hifz",()=>{
  let h=0,q=0,t=100;const tap=createVersionTapCounter(()=>h++,()=>q++,()=>t);
  for(let i=0;i<7;i++)tap();t+=2000;for(let i=0;i<7;i++)tap();expect(h).toBe(2);expect(q).toBe(0);
});
test("Quran toggle preserves existing progress",()=>{
  const values=new Map([["adhkar:quran:last","saved"],["hifz_state_v1","plan"]]);
  const storage={getItem:(k:string)=>values.get(k)??null,setItem:(k:string,v:string)=>{values.set(k,v);}};
  expect(toggleQuranV2(storage)).toBe(true);expect(toggleQuranV2(storage)).toBe(false);
  expect(values.get("adhkar:quran:last")).toBe("saved");expect(values.get("hifz_state_v1")).toBe("plan");
});