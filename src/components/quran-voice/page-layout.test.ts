import { expect, test } from "bun:test";
import { followPage, madaniSlots } from "./page-layout";
import { indexWordPages } from "./word-pages";
import type { RecitePage, ReciteWord } from "@/lib/recite/model";
function page(chapter: number, line: number): RecitePage {
  const word = { key: `${chapter}:1:1`, position: 1, line, page: 187, end: false } as ReciteWord;
  return {page:187,verses:[{key:`${chapter}:1`,chapter,number:1,juz:10,translation:"",words:[word]}]};
}
test("split ayah turns on the current word's page", () => {
  const lookup = new Map<string, number>();
  indexWordPages([{verse_key:"98:7",words:[{position:1,page_number:598,line_number:15,char_type_name:"word"},{position:5,page_number:599,line_number:1,char_type_name:"word"},{position:10,page_number:599,line_number:1,char_type_name:"end"}]}], lookup);
  expect(followPage({sura:98,aya:7,word:5,locked:true},lookup,598)).toBe(599);
  expect(lookup.has("98:7:10")).toBe(false);
});
test("unlocked positions cannot turn backwards", () => {
  expect(followPage({sura:98,aya:7,word:1,locked:false},new Map([["98:7:1",598]]),599)).toBe(599);
});
test("headers and Basmala fill separate empty slots before line three", () => {
  const slots = madaniSlots(page(97,3));
  expect(slots.length).toBe(15); expect(slots[0].header).toBe(97); expect(slots[1].basmala).toBe(97); expect(slots[2].words[0].position).toBe(1);
});
test("At-Tawbah has only a header before line two", () => {
  const slots=madaniSlots(page(9,2)); expect(slots[0].header).toBe(9); expect(slots.some(s=>s.basmala)).toBe(false);
});
test("Al-Fatiha's Basmala is its first ayah, never an extra slot", () => {
  const slots=madaniSlots(page(1,2)); expect(slots[0].header).toBe(1); expect(slots.some(s=>s.basmala)).toBe(false); expect(slots[1].words.length).toBe(1);
});
test("only one free slot gets the header without displacing words", () => {
  const slots=madaniSlots(page(2,2)); expect(slots[0].header).toBe(2); expect(slots[1].words.length).toBe(1); expect(slots.some(s=>s.basmala)).toBe(false);
});
test("a continued first ayah never creates another surah header", () => {
  const p=page(2,3); p.verses[0].words[0].position=10; expect(madaniSlots(p).some(s=>s.header || s.basmala)).toBe(false);
});