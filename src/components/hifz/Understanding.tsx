import { useEffect, useState } from "react";
import { BookOpen, Play, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { getVerseDetail, getTafsir, type VerseDetail } from "@/lib/tafsir";
import { useQuery } from "@tanstack/react-query";
import { loadPageFont, reciteChaptersOptions, recitePageOptions } from "@/lib/recite/data";
import type { ReciteWord } from "@/lib/recite/model";
import "./enhancements.css";
type Book = { id: number; name: string; language_name: string };
async function books(): Promise<Book[]> {
  const r = await fetch("https://api.quran.com/api/v4/resources/tafsirs");
  if (!r.ok) throw new Error("Books unavailable");
  const data = await r.json() as { tafsirs: Book[] };
  return data.tafsirs.filter((b) => /english|arabic/i.test(b.language_name));
}
export function Understanding({ keys, close }: { keys: string[]; close: () => void }) {
  const chapters = useQuery(reciteChaptersOptions).data ?? [];
  const [ayat, setAyat] = useState<VerseDetail[]>([]);
  const [tafsir, setTafsir] = useState(false);
  const [catalog, setCatalog] = useState<Book[]>([]);
  const [book, setBook] = useState(169);
  const [texts, setTexts] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  const keyString = keys.join(",");
  useEffect(() => { try { setBook(Number(localStorage.getItem("hifz_tafsir_book")) || 169); } catch { /* device storage optional */ } }, []);
  useEffect(() => { let canceled = false; setError(""); void Promise.all(keys.map(getVerseDetail)).then((v) => { if (!canceled) setAyat(v); }).catch(() => { if (!canceled) setError("These ayat couldn’t load. Please retry."); }); return () => { canceled = true; }; }, [keyString, retry]);
  useEffect(() => { if (!tafsir) return; let canceled = false; setError(""); void books().then((v) => { if (!canceled) { setCatalog(v); if (!v.some((b) => b.id === book)) setBook(v.find((b) => /english/i.test(b.language_name) && /kathir/i.test(b.name))?.id ?? v[0]?.id ?? 169); } }).catch(() => { if (!canceled) setError("The tafsir books couldn’t load. Please retry."); }); return () => { canceled = true; }; }, [tafsir, retry]);
  useEffect(() => { if (!tafsir) return; let canceled = false; setTexts([]); void Promise.all(keys.map((key) => getTafsir(book, key))).then((v) => { if (!canceled) setTexts(v); }).catch(() => { if (!canceled) setError("This tafsir couldn’t load. Please retry."); }); return () => { canceled = true; }; }, [tafsir, book, keyString, retry]);
  const chosen = catalog.find((b) => b.id === book);
  return <Dialog open onOpenChange={(v) => { if (!v) close(); }}><DialogContent className="hx-panel max-h-[85dvh] overflow-y-auto" aria-describedby={undefined}><header><BookOpen /><DialogTitle>{tafsir ? "Read tafsir" : "What these ayat say"}</DialogTitle></header>
    {tafsir ? <><select aria-label="Tafsir book" value={book} onChange={(e) => { const n = Number(e.target.value); setBook(n); try { localStorage.setItem("hifz_tafsir_book", String(n)); } catch { /* optional */ } }}>{catalog.map((b) => <option key={b.id} value={b.id}>{b.name} · {b.language_name}</option>)}</select><p className="hx-source">Quran.com · {chosen?.name ?? "Tafsir Ibn Kathir (Abridged)"}</p></> : <Button variant="outline" onClick={() => setTafsir(true)}><BookOpen size={16} />Read tafsir</Button>}
    {error && <><p role="alert">{error}</p><Button variant="outline" onClick={() => setRetry((n) => n + 1)}>Retry</Button></>}
    {!ayat.length && !error && <p role="status">Loading ayat…</p>}
    {ayat.map((v, i) => <section className="hx-ayah-block" key={v.key}><small>{chapters.find(c => c.id === Number(v.key.split(":")[0]))?.name_simple ?? "Quran"} · ayah {v.key.split(":")[1]}</small><MeaningArabic verse={v}/>{tafsir ? texts[i] ? <div dir={/arabic/i.test(chosen?.language_name ?? "") ? "rtl" : "ltr"} dangerouslySetInnerHTML={{ __html: texts[i] }} /> : <p role="status">Loading tafsir…</p> : <p>{v.translation}</p>}</section>)}
    <Button variant="ghost" onClick={close}><X size={16} />Close</Button>
  </DialogContent></Dialog>;
}
export function WordMeaning({ word, play, close }: { word: ReciteWord; play: () => void; close: () => void }) {
  return <Dialog open onOpenChange={(v) => { if (!v) close(); }}><DialogContent className="hx-panel" aria-describedby={undefined}><DialogTitle className="hx-echo-text" dir="rtl">{word.text}</DialogTitle><p>{word.translation}</p><p className="hx-source">{word.transliteration}</p><Button variant="outline" onClick={play}><Play size={16} />Hear word</Button><p className="hx-source">Quran.com · {word.verse}</p></DialogContent></Dialog>;
}
function MeaningArabic({ verse }: { verse: VerseDetail }) {
  const [page, setPage] = useState<number>();
  const [font, setFont] = useState<string>();
  useEffect(() => { let alive = true; void fetch(`https://api.quran.com/api/v4/verses/by_key/${verse.key}?fields=page_number`).then(r => r.json()).then((d: {verse: {page_number: number}}) => {if (alive) setPage(d.verse.page_number);}).catch(() => {}); return () => {alive = false;}; }, [verse.key]);
  const data = useQuery({...recitePageOptions(page ?? 1), enabled: !!page}).data;
  useEffect(() => { let alive = true; if (page) void loadPageFont(page).then(f => {if (alive && f) setFont(f);}); return () => {alive = false;}; }, [page]);
  const words = data?.verses.find(v => v.key === verse.key)?.words.filter(w => !w.end);
  return <p className="hx-arabic" lang="ar" dir="rtl" style={font && words ? {fontFamily: font} : undefined}>{font && words ? words.map(w => w.glyph).join("") : verse.arabic}</p>;
}
