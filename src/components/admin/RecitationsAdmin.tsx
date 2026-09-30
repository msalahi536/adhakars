import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Check, Music, Search, Trash2, Upload } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  adminAssignRecitation, adminCreateUpload, adminDeleteFile, adminRecitationsLoad, adminRegisterFile,
} from "@/lib/recitations.functions";
import { getRecitationGroups } from "@/data/recitation-cards";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type File_ = { id: string; name: string; size: number | null; url: string };

const kb = (n: number | null) => (n == null ? "" : n > 1e6 ? `${(n / 1e6).toFixed(1)} MB` : `${Math.round(n / 1e3)} KB`);

export function RecitationsAdmin({ password }: { password: string }) {
  const load = useServerFn(adminRecitationsLoad);
  const createUpload = useServerFn(adminCreateUpload);
  const register = useServerFn(adminRegisterFile);
  const del = useServerFn(adminDeleteFile);
  const assign = useServerFn(adminAssignRecitation);
  const [files, setFiles] = useState<File_[]>([]);
  const [assignments, setAssignments] = useState<Record<string, string>>({});
  const [uploading, setUploading] = useState<string | null>(null);
  const [msg, setMsg] = useState("");
  const [q, setQ] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const groups = useMemo(() => getRecitationGroups(), []);

  const refresh = useCallback(async () => {
    const r = await load({ data: { password } });
    setFiles(r.files);
    setAssignments(r.assignments);
  }, [load, password]);
  useEffect(() => { refresh().catch((e) => setMsg((e as Error).message)); }, [refresh]);

  const uploadFiles = async (list: FileList | null) => {
    if (!list?.length) return;
    setMsg("");
    try {
      for (const f of Array.from(list)) {
        setUploading(f.name);
        const { path, token } = await createUpload({ data: { password, filename: f.name } });
        const { error } = await supabase.storage.from("recitations").uploadToSignedUrl(path, token, f, { contentType: f.type || "audio/mpeg" });
        if (error) throw new Error(error.message);
        await register({ data: { password, path, name: f.name.replace(/\.[^.]+$/, ""), size: f.size } });
      }
      await refresh();
    } catch (e) { setMsg((e as Error).message); }
    finally { setUploading(null); if (inputRef.current) inputRef.current.value = ""; }
  };

  const setCard = async (dhikr_id: string, file_id: string | null) => {
    setAssignments((a) => { const n = { ...a }; if (file_id) n[dhikr_id] = file_id; else delete n[dhikr_id]; return n; });
    try { await assign({ data: { password, dhikr_id, file_id } }); } catch (e) { setMsg((e as Error).message); refresh(); }
  };

  const remove = async (f: File_) => {
    if (!confirm(`Delete "${f.name}"? Any card using it will lose its audio.`)) return;
    await del({ data: { password, id: f.id } });
    await refresh();
  };

  const usage = (id: string) => Object.values(assignments).filter((v) => v === id).length;
  const total = groups.reduce((n, g) => n + g.cards.length, 0);
  const ql = q.trim().toLowerCase();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Recitations</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Upload audio once, then pick it for any card. {Object.keys(assignments).length} of {total} cards have audio.
        </p>
        {msg && <p className="mt-2 text-sm text-destructive">{msg}</p>}
      </div>

      <section>
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-medium">Audio gallery</h2>
          <input ref={inputRef} type="file" accept="audio/*" multiple className="hidden" onChange={(e) => uploadFiles(e.target.files)} />
          <Button onClick={() => inputRef.current?.click()} disabled={!!uploading}>
            <Upload className="mr-2 h-4 w-4" />{uploading ? `Uploading ${uploading}…` : "Upload audio"}
          </Button>
        </div>
        {files.length === 0 ? (
          <button onClick={() => inputRef.current?.click()} className="mt-4 flex w-full flex-col items-center gap-2 rounded-xl border border-dashed border-border p-10 text-sm text-muted-foreground hover:border-primary/50">
            <Music className="h-6 w-6" />No audio yet. Upload MP3 or M4A files (up to 50 MB each).
          </button>
        ) : (
          <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {files.map((f) => (
              <div key={f.id} className="rounded-xl border border-border bg-card p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{f.name}</p>
                    <p className="text-xs text-muted-foreground">{kb(f.size)} · used on {usage(f.id)} card{usage(f.id) === 1 ? "" : "s"}</p>
                  </div>
                  <button onClick={() => remove(f)} className="text-muted-foreground hover:text-destructive" aria-label="Delete"><Trash2 className="h-4 w-4" /></button>
                </div>
                {f.url && <audio src={f.url} controls preload="none" className="mt-2 h-8 w-full" />}
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-medium">Cards</h2>
          <div className="relative w-full max-w-xs">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search cards" className="pl-9" />
          </div>
        </div>
        <div className="mt-4 space-y-6">
          {groups.map((g) => {
            const cards = g.cards.filter((c) => !ql || c.title.toLowerCase().includes(ql));
            if (!cards.length) return null;
            return (
              <div key={g.label}>
                <p className="mb-2 text-xs uppercase tracking-wider text-primary">{g.label}</p>
                <div className="divide-y divide-border rounded-xl border border-border bg-card">
                  {cards.map((c, i) => {
                    const val = assignments[c.id] ?? "";
                    return (
                      <div key={c.id} className="flex items-center gap-3 px-4 py-2.5">
                        <span className="w-6 text-xs text-muted-foreground">{i + 1}</span>
                        <span className="min-w-0 flex-1 truncate text-sm">{c.title}</span>
                        {val && <Check className="h-4 w-4 text-primary" />}
                        <select
                          value={val}
                          onChange={(e) => setCard(c.id, e.target.value || null)}
                          className="w-44 rounded-md border border-input bg-background px-2 py-1.5 text-sm"
                        >
                          <option value="">No audio</option>
                          {files.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
                        </select>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
