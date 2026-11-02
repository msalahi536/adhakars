/**
 * Recording studio (owner only, hidden behind the Voice Lab unlock): records the letter and
 * syllable clips the course needs. Recordings stay on the device (IndexedDB) until exported
 * as one ZIP named by clip path (e.g. syllables/ba-i.webm).
 */
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { ChevronLeft, Download, Mic, Play, Square } from "lucide-react";
import { zipSync } from "fflate";
import { recordingList, type Clip } from "@/lib/arabic";
import { useHifzBeta } from "@/lib/hifz-beta";
import "@/components/arabic/arabic.css";

export const Route = createFileRoute("/app/arabic/record")({
  head: () => ({ meta: [{ title: "Arabic audio studio, Sahih Al-Adhkar" }, { name: "robots", content: "noindex" }] }),
  component: HiddenStudio,
});

function HiddenStudio() {
  const { enabled, checked } = useHifzBeta();
  const navigate = useNavigate();
  useEffect(() => { if (checked && !enabled) void navigate({ to: "/app/more", replace: true }); }, [checked, enabled, navigate]);
  return enabled ? <Studio /> : null;
}

const DB = "arabic-recordings";
function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB, 1);
    req.onupgradeneeded = () => req.result.createObjectStore("clips");
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}
async function putClip(name: string, blob: Blob) {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction("clips", "readwrite");
    tx.objectStore("clips").put(blob, name);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}
async function allClips(): Promise<Map<string, Blob>> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("clips", "readonly");
    const req = tx.objectStore("clips").getAll();
    const keys = tx.objectStore("clips").getAllKeys();
    tx.oncomplete = () => resolve(new Map((keys.result as string[]).map((k, i) => [k, req.result[i] as Blob])));
    tx.onerror = () => reject(tx.error);
  });
}

function Studio() {
  const clips = recordingList();
  const [recorded, setRecorded] = useState<Set<string>>(new Set());
  const [exporting, setExporting] = useState(false);
  useEffect(() => { void allClips().then((m) => setRecorded(new Set(m.keys()))); }, []);

  const groups = [1, 2, 3] as const;
  const labels = { 1: "Priority 1 · first weeks", 2: "Priority 2 · long vowels and sukoon", 3: "Priority 3 · tanween" } as const;

  const exportAll = async () => {
    setExporting(true);
    try {
      const m = await allClips();
      const files: Record<string, Uint8Array> = {};
      for (const [name, blob] of m) files[`${name}.webm`] = new Uint8Array(await blob.arrayBuffer());
      const zip = zipSync(files);
      const url = URL.createObjectURL(new Blob([zip.buffer as ArrayBuffer], { type: "application/zip" }));
      const a = document.createElement("a");
      a.href = url;
      a.download = "arabic-audio.zip";
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } finally { setExporting(false); }
  };

  return (
    <div className="ab-page">
      <div className="ab-header">
        <Link to="/app/arabic" className="ab-icon-btn" aria-label="Back"><ChevronLeft size={22} /></Link>
        <h1>Recording studio</h1>
        <button className="ab-icon-btn" aria-label="Export all" disabled={exporting || !recorded.size} onClick={() => void exportAll()}><Download size={19} /></button>
      </div>
      <p className="ab-today-sub" style={{ marginBottom: "1rem" }}>
        {recorded.size} of {clips.length} clips recorded. Recordings stay on this device until you export them.
      </p>
      {groups.map((p) => (
        <section key={p}>
          <p className="ab-section-title">{labels[p]}</p>
          {clips.filter((c) => c.priority === p).map((c) => (
            <RecorderRow key={c.file} clip={c} done={recorded.has(c.file)} onSaved={() => setRecorded((s) => new Set([...s, c.file]))} />
          ))}
        </section>
      ))}
    </div>
  );
}

function RecorderRow({ clip, done, onSaved }: { clip: Clip; done: boolean; onSaved: () => void }) {
  const [recording, setRecording] = useState(false);
  const [url, setUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const mr = useRef<MediaRecorder | null>(null);
  const audio = useRef<HTMLAudioElement | null>(null);

  const start = async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { channelCount: 1 } });
      const chunks: Blob[] = [];
      const r = new MediaRecorder(stream);
      r.ondataavailable = (e) => chunks.push(e.data);
      r.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunks, { type: r.mimeType });
        await putClip(clip.file, blob);
        setUrl((old) => { if (old) URL.revokeObjectURL(old); return URL.createObjectURL(blob); });
        onSaved();
      };
      r.start();
      mr.current = r;
      setRecording(true);
    } catch {
      setError("Microphone is blocked. Allow it in Settings to record.");
    }
  };
  const stop = () => { mr.current?.stop(); setRecording(false); };

  return (
    <div className="ab-rec-row">
      <div style={{ flex: 1, minWidth: 0 }}>
        <span className="ab-rec-text" dir="rtl">{clip.text}</span>
        <small>{clip.file} · {clip.note}</small>
        {error && <small style={{ color: "var(--destructive)" }}>{error}</small>}
      </div>
      {done && !recording && <span className="ab-rec-done" aria-label="Recorded">✓</span>}
      {url && !recording && (
        <button className="ab-icon-btn" aria-label="Play" onClick={() => { audio.current?.pause(); const a = new Audio(url); audio.current = a; void a.play(); }}><Play size={17} /></button>
      )}
      <button className="ab-icon-btn" aria-label={recording ? "Stop" : done ? "Re-record" : "Record"} onClick={recording ? stop : () => void start()}>
        {recording ? <Square size={17} /> : <Mic size={17} />}
      </button>
    </div>
  );
}
