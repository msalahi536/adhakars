import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { debugZip, type DebugRecording } from "@/lib/hifz-debug";
import { readSampleConsent, canReport } from "@/lib/hifz-sample-consent";
import { uploadSample } from "@/lib/hifz-samples";
import type { CheckResult } from "@/lib/hifz-ai/checker";
import { SampleSignIn } from "./SampleConsent";

export function SampleReport({ recording, result, passages }: { recording: DebugRecording | null; result: CheckResult; passages: { sura: number; first: number; last: number }[] }) {
  const [open, setOpen] = useState(false); const [note, setNote] = useState(""); const [busy, setBusy] = useState(false); const [message, setMessage] = useState(""); const [needSignIn, setNeedSignIn] = useState(false); const [sent, setSent] = useState(false);
  if (!canReport(readSampleConsent())) return null;
  async function send() {
    if (!recording) return;
    setBusy(true); setMessage("");
    try { await uploadSample(await debugZip(recording, result, passages), passages, note); setSent(true); setMessage("Thank you. Your private report was sent."); }
    catch (e) { const text = e instanceof Error ? e.message : "Couldn’t send. Please retry."; setMessage(text); setNeedSignIn(text.startsWith("Sign in")); }
    finally { setBusy(false); }
  }
  return <><Button variant="ghost" className="w-full mt-3" onClick={() => setOpen(true)}>Report a problem</Button><Dialog open={open} onOpenChange={setOpen}><DialogContent overlayClassName="hifz-report-overlay" className="hifz-report-dialog"><DialogTitle>Report a problem</DialogTitle><DialogDescription>Your recording and checker details are sent only when you press Send report.</DialogDescription>{!recording && <p>This attempt has no recording. Enable reporting before your next recitation and retry.</p>}{!sent && <label className="text-sm space-y-2">What went wrong?<input className="w-full rounded-md border border-border bg-background text-foreground p-3" aria-label="What went wrong?" maxLength={200} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Optional note" /></label>}{needSignIn && <SampleSignIn />}{message && <p role="status">{message}</p>}{!sent && <Button disabled={busy || !recording} onClick={() => void send()}>{busy ? "Sending…" : "Send report"}</Button>}</DialogContent></Dialog></>;
}