import { Button } from "@/components/ui/button";
export function VoiceConsent({phase, progress, error, begin, cancel}: {
  phase:string; progress:number; error:string; begin:()=>void; cancel:()=>void;
}) {
  if (!["consent","loading","error"].includes(phase)) return null;
  return <div className="qv-backdrop"><section className="qv-sheet" role="dialog" aria-modal="true" aria-label="Quran voice checker">
    <h2>{phase === "consent" ? "Download voice checker" : phase === "error" ? "Let’s try again" : "Preparing voice checker…"}</h2>
    {phase === "consent" && <><p>73 MB, one time. Works offline after download.</p><p>Wi-Fi recommended.</p><Button onClick={begin}>Download &amp; start</Button><Button variant="ghost" onClick={cancel}>Not now</Button></>}
    {phase === "loading" && <><progress max={1} value={progress} aria-label="Voice checker download progress" /><p role="status">{Math.round(progress*100)}%</p><Button variant="ghost" onClick={cancel}>Cancel</Button></>}
    {phase === "error" && <><p role="alert">{error}</p><Button onClick={begin}>Retry</Button><Button variant="ghost" onClick={cancel}>Close</Button></>}
  </section></div>;
}