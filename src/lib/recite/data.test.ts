import {test,expect} from "bun:test";
import {fetchRecitePage} from "./data";
test("page 593 keeps Al-Ghashiyah 23–26 carried by page 592 membership",async()=>{
 const original=globalThis.fetch;
 globalThis.fetch=(async(input)=>{
  const membership=Number(String(input).match(/by_page\/(\d+)/)?.[1]);
  const refs=membership===592?["88:22","88:23","88:24","88:25","88:26"]:["89:1"];
  return new Response(JSON.stringify({pagination:{next_page:null},verses:refs.map(key=>({verse_key:key,verse_number:Number(key.split(":")[1]),juz_number:30,words:[{position:1,page_number:key==="88:22"?592:593,line_number:key.startsWith("89")?5:1,text_uthmani:"text",code_v2:"glyph",char_type_name:"word"}]}))}));
 }) as typeof fetch;
 try{expect((await fetchRecitePage(593)).verses.map(v=>v.key)).toEqual(["88:23","88:24","88:25","88:26","89:1"]);}finally{globalThis.fetch=original;}
});