import {expect,test} from "bun:test";
import {createState,defaultPlan} from "@/lib/hifz";
import {sleepWindow,reviewItems,previewWords,positionPages} from "./practice-rules";
import type {DayTimes} from "@/lib/prayer-times";
import type {RecitePage,ReciteWord} from "@/lib/recite/model";
const day:DayTimes={key:"2026-11-01",times:{fajr:300,sunrise:360,dhuhr:720,asr:900,maghrib:1080,isha:1200}};
test("sleep preview appears after Isha, morning recall after Fajr",()=>{
 expect(sleepWindow(new Date(2026,10,1,19,59),day,null)).toBe("morning");
 expect(sleepWindow(new Date(2026,10,1,20),day,null)).toBe("night");
 expect(sleepWindow(new Date(2026,10,1,4,59),day,null)).toBe(null);
 expect(sleepWindow(new Date(2026,10,1,5),day,null)).toBe("morning");
 expect(sleepWindow(new Date(2026,10,2,1),{...day,key:"2026-11-02"},day)).toBe("night");
});
test("manual review retains sabqi/manzil stages without reviewing new pages",()=>{
 const s=createState(defaultPlan("2026-11-01"));s.pages[1]={page:1,stage:"sabqi",linesLearned:15,history:[]};s.pages[2]={page:2,stage:"manzil",linesLearned:15,history:[]};
 expect(reviewItems(s,[1,2,1,3])).toEqual([{kind:"review",page:1,stage:"sabqi"},{kind:"review",page:2,stage:"manzil"}]);
});
const word=(position:number,line:number):ReciteWord=>({key:`112:1:${position}`,verse:"112:1",position,line,page:604,text:"word",glyph:"x",end:false,audio:null,translation:"",transliteration:""});
test("preview selects tomorrow's lines without exceeding the page",()=>{
 const page:RecitePage={page:604,verses:[{key:"112:1",chapter:112,number:1,juz:30,translation:"",words:[word(1,2),word(2,3),word(3,15)]}]};
 expect(previewWords(page,{fromLine:2,lines:2}).map((w)=>w.line)).toEqual([3]);
 expect(positionPages([page])[0].startLines).toEqual({"112:1":2});
});