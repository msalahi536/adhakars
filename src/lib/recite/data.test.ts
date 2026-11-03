import {test,expect} from "bun:test";
import {fetchRecitePage} from "./data";

test("page 593 retains Al-Ghashiyah 23–26 from previous verse membership once",async()=>{
  const original=globalThis.fetch;
  const words=(page:number,line:number)=>[{position:1,page_number:page,line_number:line,text_uthmani:"test",code_v2:"a",char_type_name:"word"}];
  const ending=[23,24,25,26].map(n=>({verse_key:`88:${n}`,verse_number:n,juz_number:30,words:words(593,n<25?1:2)}));
  const start={verse_key:"89:1",verse_number:1,juz_number:30,words:words(593,5)};
  globalThis.fetch=(async(input)=>new Response(JSON.stringify({verses:String(input).includes("by_page/592?")?ending:[ending[3],start,{verse_key:"89:24",verse_number:24,juz_number:30,words:words(594,1)}],pagination:{next_page:null}}))) as typeof fetch;
  try {
    const page=await fetchRecitePage(593);
    expect(page.verses.map(v=>v.key)).toEqual(["88:23","88:24","88:25","88:26","89:1"]);
    expect(page.verses.flatMap(v=>v.words).every(w=>w.page===593)).toBe(true);
  } finally {globalThis.fetch=original;}
});