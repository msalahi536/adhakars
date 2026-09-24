import { useCallback, useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import {
  BookOpen, GripVertical, LayoutDashboard, Moon, Pencil, Plus, Settings2, Sparkles, Star, Sun,
  Trash2, Upload, Heart, Leaf, LogOut,
} from "lucide-react";
import {
  adminBulkImport, adminDeleteItem, adminLoadAll, adminLogin, adminReorder, adminSaveItem,
  adminSaveSchedule, adminToggleActive,
} from "@/lib/admin.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Widget Admin, Sahih Al-Adhkar" },
      { name: "description", content: "Internal content manager for Sahih Al-Adhkar iOS widgets." },
      { name: "robots", content: "noindex, nofollow" },
      { property: "og:title", content: "Widget Admin, Sahih Al-Adhkar" },
      { property: "og:description", content: "Internal widget content manager." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AdminPage,
});

type Item = {
  id: string; category: string; arabic_text: string; transliteration: string | null; translation: string;
  reference: string | null; reward_note: string | null; is_active: boolean; display_order: number | null;
};
type Sched = { id: string; widget_type: string; rotation_mode: string; current_content_id: string | null };

const SECTIONS = [
  { key: "quran_verse", label: "Quran Verses", icon: BookOpen, widget: "quran_verse" },
  { key: "daily_dhikr", label: "Daily Dhikr", icon: Sparkles, widget: "daily_dhikr" },
  { key: "morning_adhkar", label: "Morning Adhkar", icon: Sun, widget: "morning_adhkar" },
  { key: "evening_adhkar", label: "Evening Adhkar", icon: Moon, widget: "evening_adhkar" },
  { key: "daily_dua", label: "Daily Duas", icon: Heart, widget: "daily_dua" },
  { key: "names_of_allah", label: "99 Names of Allah", icon: Star, widget: "name_of_allah" },
  { key: "sunnah_of_day", label: "Sunnah of the Day", icon: Leaf, widget: "sunnah" },
] as const;

const THEME: React.CSSProperties = {
  ["--background" as string]: "#0b1411",
  ["--foreground" as string]: "#e6f2ec",
  ["--card" as string]: "#12201b",
  ["--card-foreground" as string]: "#e6f2ec",
  ["--popover" as string]: "#12201b",
  ["--popover-foreground" as string]: "#e6f2ec",
  ["--muted" as string]: "#1a2c26",
  ["--muted-foreground" as string]: "#8fb0a3",
  ["--primary" as string]: "#2fbf95",
  ["--primary-foreground" as string]: "#04140e",
  ["--secondary" as string]: "#1a2c26",
  ["--secondary-foreground" as string]: "#e6f2ec",
  ["--accent" as string]: "#1f3a31",
  ["--accent-foreground" as string]: "#e6f2ec",
  ["--border" as string]: "rgba(143,176,163,0.16)",
  ["--input" as string]: "rgba(143,176,163,0.22)",
  ["--ring" as string]: "#2fbf95",
  fontFamily: "Jost, system-ui, sans-serif",
};

// Client-side mirror of the API's pick logic for previews
function hash(s: string) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
function pick(items: Item[], s: Sched | undefined) {
  if (!items.length) return null;
  const now = new Date();
  if (s?.rotation_mode === "manual" && s.current_content_id) { const f = items.find((i) => i.id === s.current_content_id); if (f) return f; }
  if (s?.rotation_mode === "random") return items[hash(`${now.toISOString().slice(0, 10)}:${s.widget_type}`) % items.length];
  const doy = Math.floor((now.getTime() - Date.UTC(now.getUTCFullYear(), 0, 0)) / 86400000);
  return items[doy % items.length];
}

function AdminPage() {
  const [password, setPassword] = useState("");
  const [authed, setAuthed] = useState(false);
  const [err, setErr] = useState("");
  const login = useServerFn(adminLogin);

  useEffect(() => {
    const saved = sessionStorage.getItem("adhkar:admin-pw");
    if (saved) login({ data: { password: saved } }).then((r) => { if (r.ok) { setPassword(saved); setAuthed(true); } });
  }, [login]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const r = await login({ data: { password } });
    if (r.ok) { sessionStorage.setItem("adhkar:admin-pw", password); setAuthed(true); setErr(""); }
    else setErr("Incorrect password");
  };

  return (
    <div style={THEME} className="min-h-screen bg-background text-foreground">
      {authed ? (
        <Dashboard password={password} onLogout={() => { sessionStorage.removeItem("adhkar:admin-pw"); setAuthed(false); setPassword(""); }} />
      ) : (
        <main className="flex min-h-screen items-center justify-center p-6">
          <form onSubmit={submit} className="w-full max-w-sm rounded-2xl border border-border bg-card p-7 shadow-2xl">
            <p className="text-xs uppercase tracking-[0.2em] text-primary">Sahih Al-Adhkar</p>
            <h1 className="mb-5 mt-1 text-2xl font-semibold">Widget Admin</h1>
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" autoFocus />
            {err && <p className="mt-2 text-sm text-destructive">{err}</p>}
            <Button type="submit" className="mt-4 w-full">Sign in</Button>
          </form>
        </main>
      )}
    </div>
  );
}

function Dashboard({ password, onLogout }: { password: string; onLogout: () => void }) {
  const load = useServerFn(adminLoadAll);
  const [content, setContent] = useState<Item[]>([]);
  const [schedule, setSchedule] = useState<Sched[]>([]);
  const [view, setView] = useState<string>("dashboard");

  const refresh = useCallback(async () => {
    const r = await load({ data: { password } });
    setContent(r.content as Item[]);
    setSchedule(r.schedule as Sched[]);
  }, [load, password]);
  useEffect(() => { refresh(); }, [refresh]);

  const nav = [
    { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    ...SECTIONS.map((s) => ({ key: s.key, label: s.label, icon: s.icon })),
    { key: "settings", label: "Widget Settings", icon: Settings2 },
  ];
  const section = SECTIONS.find((s) => s.key === view);

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <aside className="border-b border-border bg-card md:sticky md:top-0 md:h-screen md:w-64 md:border-b-0 md:border-r">
        <div className="p-5">
          <p className="text-xs uppercase tracking-[0.2em] text-primary">Sahih Al-Adhkar</p>
          <p className="text-lg font-semibold">Widget CMS</p>
        </div>
        <nav className="flex gap-1 overflow-x-auto px-3 pb-3 md:flex-col md:overflow-visible">
          {nav.map((n) => (
            <button key={n.key} onClick={() => setView(n.key)}
              className={`flex shrink-0 items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition ${view === n.key ? "bg-primary/15 text-primary" : "text-muted-foreground hover:bg-accent hover:text-foreground"}`}>
              <n.icon className="h-4 w-4" />{n.label}
            </button>
          ))}
          <button onClick={onLogout} className="flex shrink-0 items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-accent md:mt-4">
            <LogOut className="h-4 w-4" />Sign out
          </button>
        </nav>
      </aside>
      <main className="flex-1 p-5 md:p-8">
        {view === "dashboard" && <Overview content={content} schedule={schedule} onGo={setView} />}
        {section && (
          <ContentSection key={section.key} password={password} category={section.key} label={section.label}
            items={content.filter((c) => c.category === section.key)} onChange={refresh} setContent={setContent} all={content} />
        )}
        {view === "settings" && <WidgetSettings password={password} content={content} schedule={schedule} onChange={refresh} />}
      </main>
    </div>
  );
}

function Overview({ content, schedule, onGo }: { content: Item[]; schedule: Sched[]; onGo: (k: string) => void }) {
  return (
    <div>
      <h1 className="text-2xl font-semibold">Overview</h1>
      <p className="mt-1 text-sm text-muted-foreground">Public feed: <a className="text-primary underline" href="/api/widgets" target="_blank" rel="noreferrer">/api/widgets</a></p>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Total entries" value={content.length} />
        <Stat label="Active" value={content.filter((c) => c.is_active).length} />
        <Stat label="Inactive" value={content.filter((c) => !c.is_active).length} />
        <Stat label="Widgets" value={schedule.length} />
      </div>
      <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {SECTIONS.map((s) => {
          const items = content.filter((c) => c.category === s.key);
          const sch = schedule.find((x) => x.widget_type === s.widget);
          return (
            <button key={s.key} onClick={() => onGo(s.key)} className="rounded-xl border border-border bg-card p-4 text-left transition hover:border-primary/50">
              <div className="flex items-center gap-2 text-sm font-medium"><s.icon className="h-4 w-4 text-primary" />{s.label}</div>
              <p className="mt-2 text-xs text-muted-foreground">{items.filter((i) => i.is_active).length} active of {items.length} · {sch?.rotation_mode ?? "sequential"}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-2 text-3xl font-semibold text-primary">{value}</p>
    </div>
  );
}

const EMPTY = { arabic_text: "", transliteration: "", translation: "", reference: "", reward_note: "" };

function ContentSection({ password, category, label, items, onChange, setContent, all }: {
  password: string; category: string; label: string; items: Item[]; onChange: () => Promise<void>;
  setContent: (c: Item[]) => void; all: Item[];
}) {
  const save = useServerFn(adminSaveItem);
  const del = useServerFn(adminDeleteItem);
  const toggle = useServerFn(adminToggleActive);
  const reorder = useServerFn(adminReorder);
  const bulk = useServerFn(adminBulkImport);
  const [editing, setEditing] = useState<{ id?: string; form: typeof EMPTY } | null>(null);
  const [confirmDel, setConfirmDel] = useState<Item | null>(null);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkText, setBulkText] = useState("");
  const [dragId, setDragId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const cat = category as Parameters<typeof save>[0]["data"]["category"];

  const submit = async () => {
    if (!editing) return;
    setBusy(true);
    try { await save({ data: { password, id: editing.id, category: cat, item: editing.form } }); setEditing(null); await onChange(); }
    catch (e) { setMsg((e as Error).message); } finally { setBusy(false); }
  };

  const onDrop = async (targetId: string) => {
    if (!dragId || dragId === targetId) return;
    const ids = items.map((i) => i.id);
    const from = ids.indexOf(dragId); const to = ids.indexOf(targetId);
    ids.splice(to, 0, ids.splice(from, 1)[0]);
    const ordered = ids.map((id, i) => ({ ...items.find((x) => x.id === id)!, display_order: i + 1 }));
    setContent([...all.filter((c) => c.category !== category), ...ordered]);
    setDragId(null);
    await reorder({ data: { password, ids } });
  };

  const parsedBulk = useMemo(() => bulkText.split("\n").map((l) => l.trim()).filter(Boolean).map((l) => {
    const [arabic_text, transliteration, translation, reference, reward_note] = l.split("|").map((x) => x?.trim() ?? "");
    return { arabic_text, transliteration, translation, reference, reward_note };
  }), [bulkText]);
  const bulkValid = parsedBulk.length > 0 && parsedBulk.every((p) => p.arabic_text && p.translation);

  const runBulk = async () => {
    setBusy(true);
    try { await bulk({ data: { password, category: cat, items: parsedBulk } }); setBulkOpen(false); setBulkText(""); await onChange(); }
    catch (e) { setMsg((e as Error).message); } finally { setBusy(false); }
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">{label}</h1>
          <p className="text-sm text-muted-foreground">{items.length} entries · drag rows to reorder</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setBulkOpen(true)}><Upload className="mr-2 h-4 w-4" />Bulk import</Button>
          <Button onClick={() => setEditing({ form: { ...EMPTY } })}><Plus className="mr-2 h-4 w-4" />Add new</Button>
        </div>
      </div>
      {msg && <p className="mt-3 text-sm text-destructive">{msg}</p>}

      <div className="mt-6 overflow-hidden rounded-xl border border-border bg-card">
        {items.length === 0 && <p className="p-8 text-center text-sm text-muted-foreground">No entries yet.</p>}
        {items.map((it) => (
          <div key={it.id} draggable onDragStart={() => setDragId(it.id)} onDragOver={(e) => e.preventDefault()} onDrop={() => onDrop(it.id)}
            className={`flex items-center gap-3 border-b border-border px-3 py-3 last:border-b-0 ${dragId === it.id ? "opacity-50" : ""} ${it.is_active ? "" : "opacity-60"}`}>
            <GripVertical className="h-4 w-4 shrink-0 cursor-grab text-muted-foreground" />
            <div className="grid min-w-0 flex-1 gap-1 md:grid-cols-2 md:gap-4">
              <p dir="rtl" className="truncate text-lg" style={{ fontFamily: "Amiri, serif" }}>{it.arabic_text}</p>
              <div className="min-w-0">
                <p className="truncate text-sm">{it.translation}</p>
                {it.reference && <p className="truncate text-xs text-muted-foreground">{it.reference}</p>}
              </div>
            </div>
            <Switch checked={it.is_active} onCheckedChange={async (v) => {
              setContent(all.map((c) => (c.id === it.id ? { ...c, is_active: v } : c)));
              await toggle({ data: { password, id: it.id, is_active: v } });
            }} />
            <Button size="icon" variant="ghost" onClick={() => setEditing({ id: it.id, form: {
              arabic_text: it.arabic_text, transliteration: it.transliteration ?? "", translation: it.translation,
              reference: it.reference ?? "", reward_note: it.reward_note ?? "" } })}><Pencil className="h-4 w-4" /></Button>
            <Button size="icon" variant="ghost" onClick={() => setConfirmDel(it)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
          </div>
        ))}
      </div>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent style={THEME} className="max-h-[90dvh] overflow-y-auto border-border bg-card text-foreground sm:max-w-lg">
          <DialogHeader><DialogTitle>{editing?.id ? "Edit entry" : "Add entry"}</DialogTitle><DialogDescription>{label}</DialogDescription></DialogHeader>
          {editing && (
            <div className="grid gap-3">
              {([
                ["arabic_text", "Arabic text *", true],
                ["transliteration", "Transliteration", true],
                ["translation", "Translation *", true],
                ["reference", "Reference", false],
                ["reward_note", "Reward note", false],
              ] as const).map(([k, l, multi]) => (
                <div key={k} className="grid gap-1.5">
                  <Label>{l}</Label>
                  {multi ? (
                    <Textarea dir={k === "arabic_text" ? "rtl" : undefined} style={k === "arabic_text" ? { fontFamily: "Amiri, serif", fontSize: 20 } : undefined}
                      value={editing.form[k]} onChange={(e) => setEditing({ ...editing, form: { ...editing.form, [k]: e.target.value } })} />
                  ) : (
                    <Input value={editing.form[k]} onChange={(e) => setEditing({ ...editing, form: { ...editing.form, [k]: e.target.value } })} />
                  )}
                </div>
              ))}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
            <Button disabled={busy || !editing?.form.arabic_text.trim() || !editing?.form.translation.trim()} onClick={submit}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!confirmDel} onOpenChange={(o) => !o && setConfirmDel(null)}>
        <DialogContent style={THEME} className="border-border bg-card text-foreground sm:max-w-sm">
          <DialogHeader><DialogTitle>Delete entry?</DialogTitle><DialogDescription className="line-clamp-2">{confirmDel?.translation}</DialogDescription></DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDel(null)}>Cancel</Button>
            <Button variant="destructive" onClick={async () => { if (confirmDel) { await del({ data: { password, id: confirmDel.id } }); setConfirmDel(null); await onChange(); } }}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={bulkOpen} onOpenChange={setBulkOpen}>
        <DialogContent style={THEME} className="border-border bg-card text-foreground sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Bulk import</DialogTitle>
            <DialogDescription>One entry per line, fields separated by <code>|</code>: Arabic | Transliteration | Translation | Reference | Reward note. Leave a field empty to skip it.</DialogDescription>
          </DialogHeader>
          <Textarea rows={10} value={bulkText} onChange={(e) => setBulkText(e.target.value)}
            placeholder="سُبْحَانَ اللَّهِ | SubhanAllah | Glory be to Allah | Sahih Muslim 2694 |" />
          <p className="text-xs text-muted-foreground">{parsedBulk.length} entries detected{parsedBulk.length > 0 && !bulkValid ? " · each line needs Arabic and Translation" : ""}</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkOpen(false)}>Cancel</Button>
            <Button disabled={!bulkValid || busy} onClick={runBulk}>Import {parsedBulk.length || ""}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function WidgetSettings({ password, content, schedule, onChange }: { password: string; content: Item[]; schedule: Sched[]; onChange: () => Promise<void> }) {
  const saveSched = useServerFn(adminSaveSchedule);
  const update = async (widget_type: string, rotation_mode: string, current_content_id: string | null) => {
    await saveSched({ data: { password, widget_type, rotation_mode: rotation_mode as "manual", current_content_id } });
    await onChange();
  };
  return (
    <div>
      <h1 className="text-2xl font-semibold">Widget Settings</h1>
      <p className="text-sm text-muted-foreground">Choose how each widget picks its content. Changes apply to the public feed within 5 minutes.</p>
      <div className="mt-6 grid gap-5 xl:grid-cols-2">
        {SECTIONS.map((s) => {
          const sch = schedule.find((x) => x.widget_type === s.widget);
          const items = content.filter((c) => c.category === s.key && c.is_active);
          const current = pick(items, sch);
          const mode = sch?.rotation_mode ?? "sequential";
          return (
            <div key={s.key} className="rounded-xl border border-border bg-card p-5">
              <div className="flex items-center gap-2 font-medium"><s.icon className="h-4 w-4 text-primary" />{s.label}</div>
              <div className="mt-4 grid grid-cols-3 gap-1 rounded-lg bg-muted p-1">
                {([["sequential", "Sequential"], ["random", "Random Daily"], ["manual", "Manual Pick"]] as const).map(([m, l]) => (
                  <button key={m} onClick={() => update(s.widget, m, m === "manual" ? (sch?.current_content_id ?? current?.id ?? null) : (sch?.current_content_id ?? null))}
                    className={`rounded-md px-2 py-1.5 text-xs transition ${mode === m ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}>{l}</button>
                ))}
              </div>
              {mode === "manual" && (
                <select value={sch?.current_content_id ?? ""} onChange={(e) => update(s.widget, "manual", e.target.value || null)}
                  className="mt-3 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                  <option value="">Select an entry</option>
                  {items.map((i) => <option key={i.id} value={i.id}>{i.translation.slice(0, 70)}</option>)}
                </select>
              )}
              <div className="mt-4 rounded-2xl bg-gradient-to-br from-primary/25 to-accent p-5 shadow-inner">
                <p className="text-[10px] uppercase tracking-[0.2em] text-primary">{s.label}</p>
                {current ? (
                  <>
                    <p dir="rtl" className="mt-3 text-xl leading-relaxed" style={{ fontFamily: "Amiri, serif" }}>{current.arabic_text}</p>
                    {current.transliteration && <p className="mt-2 text-xs italic text-muted-foreground">{current.transliteration}</p>}
                    <p className="mt-2 text-sm">{current.translation}</p>
                    {(current.reference || current.reward_note) && (
                      <p className="mt-2 text-[11px] text-muted-foreground">{[current.reference, current.reward_note].filter(Boolean).join(" · ")}</p>
                    )}
                  </>
                ) : <p className="mt-3 text-sm text-muted-foreground">No active entries.</p>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
