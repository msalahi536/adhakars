import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ShieldCheck, Trash2 } from "lucide-react";
import { makeSampleConsent, readSampleConsent, saveSampleConsent, NO_SAMPLE_CONSENT } from "@/lib/hifz-sample-consent";
import { deleteMySamples } from "@/lib/hifz-samples";
import { lovable } from "@/integrations/lovable";

export function SampleSignIn() {
  const [error, setError] = useState("");
  async function signIn(provider: "google" | "lovable") {
    setError("");
    try { const result = await lovable.auth.signInWithOAuth(provider, { redirect_uri: `${window.location.origin}/app/settings` }); if (result.error) setError("Sign-in couldn’t finish. Please retry."); } catch { setError("Sign-in couldn’t finish. Please retry."); }
  }
  return <div className="space-y-2"><p className="text-sm text-muted-foreground">Sign in only to send or delete your private samples. Hifz stays available without an account.</p><Button variant="outline" onClick={() => void signIn("google")}>Continue with Google</Button><Button variant="outline" onClick={() => void signIn("lovable")}>Sign in with Lovable</Button>{error && <p role="alert">{error}</p>}</div>;
}
export function SampleConsentSettings() {
  const [consent, setConsent] = useState(NO_SAMPLE_CONSENT);
  const [open, setOpen] = useState(false);
  const [adult, setAdult] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [message, setMessage] = useState("");
  const [needSignIn, setNeedSignIn] = useState(false);
  useEffect(() => { setConsent(readSampleConsent()); }, []);
  function change(v: boolean) { if (v) { setAdult(false); setOpen(true); } else { saveSampleConsent(NO_SAMPLE_CONSENT); setConsent(NO_SAMPLE_CONSENT); } }
  async function remove() {
    setDeleting(true); setMessage("");
    try { await deleteMySamples(); setMessage("Your samples have been deleted."); setConfirmDelete(false); setNeedSignIn(false); }
    catch (e) { const text = e instanceof Error ? e.message : "Couldn’t delete samples. Please retry."; setMessage(text); setNeedSignIn(text.startsWith("Sign in")); }
    finally { setDeleting(false); }
  }
  return <>
    <div className="rc-toggle-row"><span className="rc-setting-label"><ShieldCheck aria-hidden="true" /><span>Help improve recitation checking</span></span><Switch aria-label="Help improve recitation checking" checked={consent.enabled} onCheckedChange={change} /></div>
    {consent.enabled && <p className="text-xs text-muted-foreground">Consented {consent.date ? new Date(consent.date).toLocaleDateString() : ""}. Only reports you choose to send are uploaded.</p>}
    <Button variant="ghost" className="rc-guide-toggle" onClick={() => setConfirmDelete(true)}><Trash2 size={16} />Delete my samples</Button>
    {message && <p role="status" className="text-sm">{message}</p>}
    <Dialog open={open} onOpenChange={setOpen}><DialogContent overlayClassName="hifz-report-overlay" className="hifz-report-dialog max-h-[85dvh] overflow-y-auto"><ShieldCheck className="text-accent" /><DialogTitle>Help improve the checker</DialogTitle><DialogDescription>Optional · only when you report a problem</DialogDescription><div className="space-y-3 text-sm leading-relaxed"><p>When you tap “Report a problem”, your recording, what the AI heard, word comparisons, passage and device details are sent privately to help make recitation checking more accurate.</p><p>Nothing is uploaded automatically. Your samples are never sold or shared. You can delete them anytime using “Delete my samples”.</p><label className="flex items-center gap-3 py-3"><Checkbox checked={adult} onCheckedChange={(v) => setAdult(v === true)} />I am 18 or older</label><Button disabled={!adult} className="w-full" onClick={() => { const c = makeSampleConsent(adult); saveSampleConsent(c); setConsent(c); setOpen(false); }}>Agree &amp; enable</Button><Button variant="ghost" className="w-full" onClick={() => setOpen(false)}>Not now</Button></div></DialogContent></Dialog>
    <Dialog open={confirmDelete} onOpenChange={setConfirmDelete}><DialogContent overlayClassName="hifz-report-overlay" className="hifz-report-dialog"><DialogTitle>Delete my samples</DialogTitle><DialogDescription>This permanently removes your uploaded recordings and report details. Your Hifz progress stays unchanged.</DialogDescription>{needSignIn && <SampleSignIn />}<Button variant="destructive" disabled={deleting} onClick={() => void remove()}>{deleting ? "Deleting…" : "Delete all my samples"}</Button>{message && <p role="status">{message}</p>}</DialogContent></Dialog>
  </>;
}