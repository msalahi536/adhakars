import {test,expect} from "bun:test";
import {pageRanges,passageContains} from "./reader-rules";
import type {RecitePage,ReciteWord} from "@/lib/recite/model";

test("split ayah membership uses absolute word positions, not its starting page",()=>{
  const page={page:50,verses:[{chapter:2,number:286,words:[{key:"2:286:40",position:40,end:false,page:50}]},{chapter:3,number:1,words:[{key:"3:1:1",position:1,end:false,page:50}]}]} as RecitePage;
  expect(passageContains(page,{sura:2,aya:286,word:40})).toBe(true);
  expect(passageContains(page,{sura:2,aya:286,word:1})).toBe(false);
  expect(pageRanges(page)).toEqual([{sura:2,first:286,last:286},{sura:3,first:1,last:1}]);
});