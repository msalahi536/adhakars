import {test,expect} from "bun:test";
import {adjacentPage,completedReading,currentRecitationWord,nextLayout,recitedWord,swipeDestination,visiblePageNumber,passageContains,hiddenWordVisible,mushafRows,topReadingWord,recitationReadingWord,matchesSurahSearch} from "./reader-rules";
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
test("hidden pending word stays hidden even when inferred current during a breath",()=>{
 const marks={"3:1:1":"correct","3:1:2":"pending"} as const;
 expect(currentRecitationWord(words,marks,true)).toBe("3:1:2");expect(hiddenWordVisible(marks["3:1:2"])).toBe(false);
 for(const state of ["in_progress","correct","unsure","wrong","skipped"])expect(hiddenWordVisible(state)).toBe(true);
 expect(hiddenWordVisible("pending",true)).toBe(true);
});
test("surah decorations never replace occupied lines before Al-Fajr",()=>{
 const ending={key:"88:26:1",line:3,position:1} as ReciteWord;
 const start={key:"89:1:1",line:5,position:1} as ReciteWord;
 const page={page:593,verses:[{number:26,chapter:88,words:[ending]},{number:1,chapter:89,words:[start]}]} as RecitePage;
 const rows=mushafRows(page);expect(rows.flatMap(r=>r.words)).toEqual([ending,start]);expect(rows[2].chapter).toBe(0);expect(rows[3].basmala).toBe(true);
});
test("reading position ignores offscreen neighbors and never infers the next surah",()=>{
 expect(topReadingWord([{key:"87:19:1",top:50,bottom:70},{key:"88:1:1",top:100,bottom:140},{key:"89:1:1",top:900,bottom:940}],80,850)).toBe("88:1:1");
 expect(recitationReadingWord(words,{"3:1:2":"correct","3:1:3":"pending"})?.key).toBe("3:1:2");
 expect(recitationReadingWord(words,{"3:1:2":"correct","3:1:3":"in_progress"})?.key).toBe("3:1:3");
});
test("Arabic variants, exact numbers and prefix-free English find surahs",()=>{
 const mulk={id:67,name_simple:"Al-Mulk",name_arabic:"الملك"};
 for(const q of ["الملك","ملك","سورة الملك","67","٦٧","مُـلْك","mulk"])expect(matchesSurahSearch(mulk,q)).toBe(true);
 expect(matchesSurahSearch(mulk,"6")).toBe(false);
 expect(matchesSurahSearch({id:2,name_simple:"Al-Baqarah",name_arabic:"البقرة"},"baqara")).toBe(true);
});
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