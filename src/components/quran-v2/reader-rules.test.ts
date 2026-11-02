import {test,expect} from "bun:test";
import {adjacentPage,completedReading,ELSEWHERE_DELAY,nextLayout} from "./reader-rules";
test("layout cycles Mushaf text, Framed mushaf, Translation",()=>{expect(nextLayout("Mushaf text")).toBe("Framed mushaf");expect(nextLayout("Framed mushaf")).toBe("Translation");expect(nextLayout("Translation")).toBe("Mushaf text");});
test("100 percent read is complete rather than Continue",()=>{expect(completedReading(6,7)).toBe(false);expect(completedReading(7,7)).toBe(true);});
test("elsewhere auto go waits two seconds",()=>expect(ELSEWHERE_DELAY).toBe(2000));
test("only immediate next page is a silent continuation",()=>{expect(adjacentPage(603,604)).toBe(true);expect(adjacentPage(604,605)).toBe(false);expect(adjacentPage(10,12)).toBe(false);});