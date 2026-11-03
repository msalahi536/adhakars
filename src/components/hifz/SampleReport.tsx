import { useState, useEffect } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { sampleConsent, consentSamples } from "@/lib/hifz-sample-consent";
import { sendSample } from "@/lib/hifz-samples";
import { debugEnabled, exportDebug } from "@/lib/hifz-debug";
import { SampleConsentSettings, SampleSignIn } from "./SampleConsent";
import type { CheckResult } from "@/lib/hifz-ai";
import type { Attempt, Passage } from "@/components/recite/ai-performance";

export function SampleReport({ result, recording, passages, updates = [] }: { result: CheckResult; recording: Blob | null; passages: Passage[]; updates?: { elapsed: number; result: CheckResult }[] }) {
  const [open, setOpen] = useState(false), [adult, setAdult] = useState(false), [user, setUser] = useState(false);
  const [note, setNote] = useState(""), [busy, setBusy] = useState(false), [message, setMessage] = useState("");
  const [debug, setDebug] = useState(false);
  useEffect(() => { setDebug(debugEnabled()); }, []);
  const refresh = async () => { try { const c = await sampleConsent(); setUser(!!c.user); } catch { setMessage("Your reporting preference couldn’t load. Please retry."); } };
  async function send() {
    if (!adult || !recording || busy) return;
    setBusy(true); setMessage("");
    try { await consentSamples(adult); await sendSample(recording, result, passages, note); setMessage("Report sent privately. Thank you."); setOpen(false); }
    catch (e) { setMessage(e instanceof Error ? e.message : "Report couldn’t send. Please retry."); }
    finally { setBusy(false); }
  }
  return <>
    <Button variant="ghost" size="sm" onClick={() => { setAdult(false); setOpen(true); void refresh(); }}>Report a wrong result</Button>
    {debug && <Button variant="ghost" size="sm" disabled={!recording || busy} onClick={() => { if (!recording) return; setBusy(true); void exportDebug(recording, result, passages, updates).catch(() => setMessage("Export couldn’t finish. Please retry.")).finally(() => setBusy(false)); }}><Download size={15}/>Export test ZIP</Button>}
    {message && !open && <p role="status">{message}</p>}
    <Dialog open={open} onOpenChange={v => { if (!busy) setOpen(v); }}><DialogContent className="hx-panel max-h-[85dvh] overflow-y-auto" aria-describedby={undefined}><DialogTitle>Report a wrong result</DialogTitle>
      <p>Your recording, the checker’s raw output and timings, passage, account ID, consent date, device details and optional note are sent only when you press Send report.</p>
      <p>Reports are private and owner-accessible, never sold or publicly shared. Authorized operators and hosting providers may process them to investigate the result. You can delete your reports anytime.</p>
      {!recording && <p>This session has no recording. Finish a new recitation before reporting.</p>}
      {!user ? <SampleSignIn done={() => void refresh()}/> : <>
        <label>What went wrong?<input aria-label="What went wrong?" className="w-full border border-border bg-background p-3 text-foreground" maxLength={200} value={note} onChange={e => setNote(e.target.value)}/></label>
        <label className="flex items-center gap-3"><Checkbox checked={adult} onCheckedChange={v => setAdult(v === true)}/>I am 18 or older and agree to send this recording privately</label>
        <Button disabled={!adult || !recording || busy} onClick={() => void send()}>{busy ? "Sending…" : "Send report"}</Button>
      </>}
      <SampleConsentSettings/>
      {message && <p role="status">{message}</p>}
    </DialogContent></Dialog>
  </>;
}
export function ReportProblem({ attempt, recording, passages }: { attempt: Attempt; recording: Blob | null; passages: Passage[] }) {
  return <SampleReport result={attempt.result} recording={recording} passages={passages}/>;
}