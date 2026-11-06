import type { Marks, ReciteWord } from "@/lib/recite/model";
import { currentRecitationWord, hiddenWordVisible, recitedWord } from "./reader-rules";

export function liveWordState(status: string | undefined, added = false, manual = false) {
  const mistake = status === "wrong" || status === "skipped" || added;
  return { mistake, recited: !mistake && recitedWord(status), visible: mistake || hiddenWordVisible(status, manual), highlightable: status !== "pending" };
}

/** Apply feedback before React renders the surrounding reader or asynchronous tips. */
export function paintLiveWords(root: ParentNode, marks: Marks, active: boolean, highlight: string | null = null, added: ReadonlySet<string> = new Set()) {
  const all = [...root.querySelectorAll<HTMLElement>("[data-q2-page]:not(.q2-preview) [data-q2-word]")];
  const words = all.map(node => ({key:node.dataset.q2Word??"",end:false} as ReciteWord));
  const explicit = Object.keys(marks).find(key => marks[key] === "in_progress");
  const current = active ? explicit ?? currentRecitationWord(words,marks,true) : undefined;
  for (const page of root.querySelectorAll<HTMLElement>("[data-q2-page]")) {
    if (page.classList.contains("q2-preview")) continue;
    const nodes = [...page.querySelectorAll<HTMLElement>("[data-q2-word]")];
    for (const node of nodes) {
      const key = node.dataset.q2Word ?? "", status = marks[key];
      const state = liveWordState(status, added.has(key), node.dataset.q2Revealed === "true");
      node.classList.toggle("q2-recited", state.recited);
      node.classList.toggle("q2-current", key === current);
      node.classList.toggle("q2-wrong", state.mistake);
      node.classList.remove("q2-skipped", "q2-added");
      node.classList.toggle("q2-highlight", state.highlightable && key === highlight);
      if (node.dataset.q2Hidden === "true") node.classList.toggle("q2-concealed", !state.visible);
    }
  }
}