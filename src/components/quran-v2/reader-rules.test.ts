import {test,expect} from "bun:test";
import {adjacentPage,completedReading,currentRecitationWord,ELSEWHERE_DELAY,nextLayout} from "./reader-rules";
import type {ReciteWord} from "@/lib/recite/model";
test("layout cycles Mushaf text, Framed mushaf, Translation",()=>{expect(nextLayout("Mushaf text")).toBe("Framed mushaf");expect(nextLayout("Framed mushaf")).toBe("Translation");expect(nextLayout("Translation")).toBe("Mushaf text");});
test("100 percent read is complete rather than Continue",()=>{expect(completedReading(6,7)).toBe(false);expect(completedReading(7,7)).toBe(true);});
test("elsewhere auto go waits two seconds",()=>expect(ELSEWHERE_DELAY).toBe(2000));
test("only immediate next page is a silent continuation",()=>{expect(adjacentPage(603,604)).toBe(true);expect(adjacentPage(604,605)).toBe(false);expect(adjacentPage(10,12)).toBe(false);});
const words = ["3:1:1", "3:1:2", "3:1:3", "3:1:4"].map(key => ({key, end:false} as ReciteWord));
test("current word follows correct and unsure words, not an earlier pending word", () => {
  expect(currentRecitationWord(words, {"3:1:1":"pending", "3:1:2":"correct", "3:1:3":"unsure", "3:1:4":"pending"}, true)).toBe("3:1:4");
});
test("explicit in-progress takes priority and inactive mic has no current word", () => {
  expect(currentRecitationWord(words, {"3:1:2":"in_progress"}, true)).toBe("3:1:2");
  expect(currentRecitationWord(words, {"3:1:2":"in_progress"}, false)).toBeUndefined();
  expect(currentRecitationWord(words, {}, true)).toBeUndefined();
});