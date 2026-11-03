import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { lovable } from "@/integrations/lovable";
import "@lovable.dev/cloud-auth-js/styles.css";
import { consentSamples, deleteSamples, revokeSamples, sampleConsent, sendSample } from "@/components/recite/sample-client";
import "@/components/hifz/enhancements.css";
export function SampleSignIn({ done }: { done: () => void }) {
  const [error, setError] = useState("");
  async function signIn(provider: "google" | "lovable") {
    const result = await lovable.auth.signInWithOAuth(provider, { redirect_uri: `${window.location.origin}/app/report-signin` });
    if (result.error) setError("Sign-in couldn’t open. Please retry."); else if (!result.redirected) done();
  }
  return <><p>Sign in to manage and delete your reports. Worship features still work without an account.</p><Button variant="outline" onClick={() => void signIn("google")}>Continue with Google</Button><Button className="lovable-auth-button" onClick={() => void signIn("lovable")}>Continue with Lovable</Button>{error && <p role="alert">{error}</p>}</>;
}
export function SampleConsentSettings() {
  const [consent, setConsent] = useState<string | null>(null); const [user, setUser] = useState(false); const [open, setOpen] = useState(false); const [adult, setAdult] = useState(false); const [busy, setBusy] = useState(false); const [message, setMessage] = useState("");
  const refresh = async () => { try { const v = await sampleConsent(); setUser(!!v.user); setConsent(v.consent); } catch (e) { setMessage(e instanceof Error ? e.message : "Please retry."); } };
  useEffect(() => { void refresh(); }, []);
  async function save() { if (!adult) return; setBusy(true); try { setConsent(await consentSamples(adult)); setOpen(false); } catch (e) { setMessage(e instanceof Error ? e.message : "Please retry."); } finally { setBusy(false); } }
  return <><div className="rc-toggle-row"><span>Help improve recitation checking</span><Switch aria-label="Help improve recitation checking" checked={!!consent} disabled={busy} onCheckedChange={(v) => { if (v) { setAdult(false); setOpen(true); void refresh(); } else { setBusy(true); void revokeSamples().then(() => setConsent(null)).catch(() => setMessage("Reporting couldn’t turn off.")).finally(() => setBusy(false)); } }} /></div>
    {consent && <small>Consent saved {new Date(consent).toLocaleDateString()}</small>}
    <Button variant="ghost" disabled={busy} onClick={() => { if (!user) { setOpen(true); return; } if (!window.confirm("Delete all your submitted recordings and reports? This cannot be undone.")) return; setBusy(true); void deleteSamples().then(() => setMessage("Your samples were deleted.")).catch((e) => setMessage(e instanceof Error ? e.message : "Please retry.")).finally(() => setBusy(false)); }}>Delete my samples</Button>
    {message && <p role="status">{message}</p>}
    <Dialog open={open} onOpenChange={setOpen}><DialogContent className="hx-panel max-h-[85dvh] overflow-y-auto" aria-describedby={undefined}><DialogTitle>Help improve recitation checking</DialogTitle>
      {!user ? <SampleSignIn done={() => void refresh()} /> : <><p>Only when you tap Report a problem, we send your recording, what the checker heard, word comparisons, passage, technical diagnostics, optional note, account ID and consent/submission dates.</p><p>Reports help investigate and improve recitation checking. They are private, never sold or publicly shared. Authorized operators and contracted hosting providers can process them for that purpose; legal disclosure may be required. No voice identification or unrelated model training.</p><p>You can turn this off and delete your samples at any time. Provider backups or copies already downloaded may take longer to disappear. Record only yourself; do not include children or background conversations.</p><label className="flex items-center gap-3"><Checkbox checked={adult} onCheckedChange={(v) => setAdult(v === true)} />I am 18 or older</label><Button disabled={!adult || busy} onClick={() => void save()}>I agree</Button>{message && <p role="alert">{message}</p>}</>}
    </DialogContent></Dialog></>;
}
