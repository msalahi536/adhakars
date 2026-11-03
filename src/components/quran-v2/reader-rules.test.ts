import {test,expect} from "bun:test";
import {adjacentPage,completedReading,currentRecitationWord,nextLayout,recitedWord,swipeDestination,visiblePageNumber,passageContains} from "./reader-rules";
import type {ReciteWord,RecitePage} from "@/lib/recite/model";
test("recitation uses the scrolled page with the most visible pixels, not a shorter neighbor",()=>{
 expect(visiblePageNumber([{page:49,top:-200,bottom:150},{page:50,top:150,bottom:1450}],100,850)).toBe(50);
});
test("an ayah already on the page is not elsewhere",()=>{
 const page={verses:[{chapter:3,number:1},{chapter:3,number:2}]} as RecitePage;
 expect(passageContains(page,{sura:3,aya:2})).toBe(true);
 expect(passageContains(page,{sura:2,aya:2})).toBe(false);
});
test("layout cycles Mushaf text, Framed mushaf, Translation",()=>{expect(nextLayout("Mushaf text")).toBe("Framed mushaf");expect(nextLayout("Framed mushaf")).toBe("Translation");expect(nextLayout("Translation")).toBe("Mushaf text");});
test("100 percent read is complete rather than Continue",()=>{expect(completedReading(6,7)).toBe(false);expect(completedReading(7,7)).toBe(true);});
test("only immediate next page is a silent continuation",()=>{expect(adjacentPage(603,604)).toBe(true);expect(adjacentPage(604,605)).toBe(false);expect(adjacentPage(10,12)).toBe(false);});
const words = ["3:1:1", "3:1:2", "3:1:3", "3:1:4"].map(key => ({key, end:false} as ReciteWord));
test("correct and unsure are done, errors and pending are not",()=>{expect(recitedWord("correct")).toBe(true);expect(recitedWord("unsure")).toBe(true);for(const s of ["wrong","skipped","pending","in_progress"])expect(recitedWord(s)).toBe(false);});
test("RTL swipes turn exactly one page and stop at Quran boundaries",()=>{expect(swipeDestination(50,220,10)).toBe(51);expect(swipeDestination(50,-220,10)).toBe(49);expect(swipeDestination(604,220,0)).toBe(604);expect(swipeDestination(1,-220,0)).toBe(1);});
test("vertical movement and short taps never turn a page",()=>{expect(swipeDestination(50,20,0)).toBe(50);expect(swipeDestination(50,80,100)).toBe(50);});
test("current word follows correct and unsure words, not an earlier pending word", () => {
  expect(currentRecitationWord(words, {"3:1:1":"pending", "3:1:2":"correct", "3:1:3":"unsure", "3:1:4":"pending"}, true)).toBe("3:1:4");
});
test("explicit in-progress takes priority and inactive mic has no current word", () => {
  expect(currentRecitationWord(words, {"3:1:2":"in_progress"}, true)).toBe("3:1:2");
  expect(currentRecitationWord(words, {"3:1:2":"in_progress"}, false)).toBeUndefined();
  expect(currentRecitationWord(words, {}, true)).toBeUndefined();
});