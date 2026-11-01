import { useEffect, useState } from "react";
import { Award, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Portal } from "@/components/Portal";
import { milestones, newMilestones, type HifzState, type QuranIndex } from "@/lib/hifz";
import type { Milestone } from "@/lib/hifz/insights";
import { play } from "@/lib/hifzHaptics";
import { milestoneKey } from "./enhancement-rules";
import "./enhancements.css";
const KEY = "hifz_celebrated_v1";
export function pendingMilestones(state: HifzState, q: QuranIndex, names: Record<number, string>) {
  let celebrated: string[] = [];
  try { celebrated = JSON.parse(localStorage.getItem(KEY) || "[]"); } catch { /* new device */ }
  return newMilestones(milestones(state, q, names), celebrated);
}
export function MilestoneMoment({ moment, done }: { moment: Milestone; done: () => void }) {
  const [error, setError] = useState("");
  const text = `I memorized ${moment.kind === "surah" ? "Surah " : ""}${moment.label} 🤍`;
  useEffect(() => {
    play("milestone");
    try { const keys: string[] = JSON.parse(localStorage.getItem(KEY) || "[]"); localStorage.setItem(KEY, JSON.stringify([...new Set([...keys, milestoneKey(moment)])])); } catch { /* optional storage */ }
  }, [moment.kind, moment.id]);
  async function share() {
    setError("");
    const root = document.querySelector(".recite-page") ?? document.documentElement;
    const canvas = document.createElement("canvas"); canvas.width = 1080; canvas.height = 1080;
    const ctx = canvas.getContext("2d"); if (!ctx) return;
    // Resolve themed CSS colors through the browser rather than assuming their format.
    const color = (role: string) => { const probe = document.createElement("span"); probe.style.setProperty("transition", "none", "important"); probe.style.setProperty("color", role, "important"); root.append(probe); const resolved = getComputedStyle(probe).color; probe.remove(); return resolved; };
    ctx.fillStyle = color("var(--m-paper, var(--background))"); ctx.fillRect(0, 0, 1080, 1080);
    ctx.strokeStyle = color("var(--m-gold, var(--accent))"); ctx.lineWidth = 4;
    ctx.strokeRect(48, 48, 984, 984); ctx.strokeRect(64, 64, 952, 952);
    for (const [x,y] of [[48,48],[1032,48],[48,1032],[1032,1032]]) { ctx.save();ctx.translate(x,y);ctx.rotate(Math.PI/4);ctx.strokeRect(-12,-12,24,24);ctx.restore(); }
    ctx.fillStyle = color("var(--m-ink, var(--foreground))");
    ctx.textAlign = "center"; ctx.font = "34px Georgia"; ctx.fillText("Alhamdulillah", 540, 350);
    ctx.font = "50px Georgia"; ctx.fillText("I memorized", 540, 470);
    ctx.font = "54px Georgia"; const title = `${moment.kind === "surah" ? "Surah " : ""}${moment.label}`;
    if (ctx.measureText(title).width > 820) ctx.font = "38px Georgia";
    ctx.fillText(title, 540, 550); ctx.font = "48px sans-serif"; ctx.fillText("🤍", 540, 645);
    ctx.font = "26px Georgia"; ctx.fillText("Sahih Al-Adhkar", 540, 890);
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png")); if (!blob) return;
    const file = new File([blob], `${milestoneKey(moment).replace(":", "-")}.png`, { type: "image/png" });
    try { if (navigator.canShare?.({ files: [file] })) await navigator.share({ files: [file], title: text }); else { const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = file.name; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); } } catch (e) { if (!(e instanceof DOMException && e.name === "AbortError")) setError("Sharing couldn’t open. Please try again."); }
  }
  return <Portal><section className="hx-milestone" role="dialog" aria-modal="true" aria-label="Milestone moment"><div className="hx-milestone-inner"><Award size={52} className="mx-auto" /><h2>Alhamdulillah — you memorized {moment.kind === "surah" ? "Surah " : ""}{moment.label}</h2><p>A beautiful step. Gentle, regular review will help you keep it close.</p><div className="hx-share-art"><strong>{text}</strong><small>Sahih Al-Adhkar</small></div><div className="hx-controls"><Button variant="outline" onClick={() => void share()}><Share2 size={16} />Share</Button><Button onClick={done}>Continue</Button></div>{error && <p role="alert">{error}</p>}</div></section></Portal>;
}