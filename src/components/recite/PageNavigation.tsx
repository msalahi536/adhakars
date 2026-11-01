import { useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Chapter } from "@/lib/quran";
import { reciteDestinationPage } from "@/lib/recite/data";

export function PageNavigation({ page, chapter, juz, chapters, go, close }: { page: number; chapter?: number; juz?: number; chapters: Chapter[]; go: (page: number) => void; close: () => void }) {
  const [number, setNumber] = useState(String(page));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function destination(kind: "surah" | "juz", id: number) {
    setBusy(true); setError("");
    try { go(await reciteDestinationPage(kind, id)); }
    catch (e) { setError(e instanceof Error ? e.message : "Please try again."); }
    finally { setBusy(false); }
  }
  return <section className="rc-sheet rc-settings" role="dialog" aria-modal="true" aria-label="Go to page">
    <header><h2>Go to page</h2><Button variant="ghost" size="icon" aria-label="Close page navigation" onClick={close}><X /></Button></header>
    <form onSubmit={(e) => { e.preventDefault(); const value = Number(number); if (Number.isInteger(value) && value >= 1 && value <= 604) go(value); }}>
      <label className="rc-setting">Page<input aria-label="Page number" type="number" min="1" max="604" required value={number} onChange={(e) => setNumber(e.target.value)} /></label>
      <Button className="rc-primary" type="submit" disabled={busy}>Open page</Button>
    </form>
    <label className="rc-setting">Surah<select aria-label="Surah" defaultValue={chapter ?? ""} disabled={busy} onChange={(e) => void destination("surah", Number(e.target.value))}><option value="" disabled>Select surah</option>{chapters.map((c) => <option key={c.id} value={c.id}>{c.name_simple} · {c.name_arabic}</option>)}</select></label>
    <label className="rc-setting">Juz<select aria-label="Juz" defaultValue={juz ?? ""} disabled={busy} onChange={(e) => void destination("juz", Number(e.target.value))}><option value="" disabled>Select juz</option>{Array.from({ length: 30 }, (_, i) => <option key={i + 1} value={i + 1}>Juz {i + 1}</option>)}</select></label>
    {busy && <p role="status">Loading page…</p>}{error && <p role="alert">{error}</p>}
  </section>;
}