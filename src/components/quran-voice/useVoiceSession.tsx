import { useEffect, useRef, useState } from "react";
import type { FollowPosition, FollowSession } from "@/lib/hifz-ai/follow";
import type { Mic } from "@/lib/hifz-ai/mic";
import type { QuranRecognizer } from "@/lib/hifz-ai/recognizer";
import { quranPlayer } from "@/lib/quran-player";
import { recitationPlayer } from "@/lib/recitation-player";
import { VOICE_SEARCH_MS } from "./rules";

export type Match = { sura: number; aya: number; word: number; score: number };
export function useVoiceSession(mode: "follow" | "search", onPosition: (p: FollowPosition) => void, onMatches: (m: Match[]) => void) {
  const [phase, setPhase] = useState<"idle" | "consent" | "loading" | "active" | "finishing" | "error">("idle");
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const [remaining, setRemaining] = useState(8);
  const position = useRef(onPosition); position.current = onPosition;
  const matches = useRef(onMatches); matches.current = onMatches;
  const generation = useRef(0);
  const follow = useRef<FollowSession | null>(null);
  const mic = useRef<Mic | null>(null);
  const recognizer = useRef<QuranRecognizer | null>(null);
  const queue = useRef<Promise<void>>(Promise.resolve());
  const heard = useRef("");
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const busy = useRef(false);
  const finishing = useRef(false);
  const clearTimer = () => { if (timer.current) clearInterval(timer.current); timer.current = null; };
  const release = () => {
    clearTimer();
    const f = follow.current; follow.current = null;
    if (f) { f.stream.getTracks().forEach((t) => t.stop()); void f.stop().catch(() => undefined); }
    const m = mic.current; mic.current = null;
    if (m) void m.close().catch(() => undefined);
  };
  const fail = (e: unknown) => {
    generation.current++; release(); busy.current = false; finishing.current = false;
    const name = e instanceof Error ? e.name : "";
    setError(name === "NotAllowedError" || name === "SecurityError" ? "Microphone access is off. Allow it in your browser or phone settings, then retry." : "Couldn’t start listening. Check your connection and try again.");
    setPhase("error");
  };
  useEffect(() => () => { generation.current++; release(); }, []);
  async function begin() {
    if (busy.current) return;
    busy.current = true; finishing.current = false;
    const id = ++generation.current;
    setPhase("loading"); setError(""); setProgress(0); heard.current = "";
    quranPlayer.pause(); recitationPlayer.pause();
    try {
      const engine = await import("@/lib/hifz-ai");
      await engine.prepareChecker((p) => { if (id === generation.current) setProgress(p); });
      if (id !== generation.current) return;
      if (mode === "follow") {
        const current = await engine.startFollowing({onPosition:(p) => { if (id === generation.current) position.current(p); }, onError:(e) => { if (id === generation.current) fail(e); }});
        if (id !== generation.current) { await current.stop(); return; }
        follow.current = current;
      } else {
        const rec = await engine.getRecognizer(); rec.restart(); recognizer.current = rec;
        queue.current = Promise.resolve();
        const current = await engine.openMic((samples) => {
          if (id !== generation.current || finishing.current) return;
          queue.current = queue.current.then(async () => {
            const emissions = await rec.accept(samples);
            heard.current += emissions.map((e) => e.token).join("");
          }).catch((e) => { if (id === generation.current) fail(e); });
        });
        if (id !== generation.current) { await current.close(); return; }
        mic.current = current; setRemaining(8);
        const end = Date.now() + VOICE_SEARCH_MS;
        timer.current = setInterval(() => {
          setRemaining(Math.max(0, Math.ceil((end - Date.now()) / 1000)));
          if (Date.now() >= end) void stop();
        }, 100);
      }
      if (id === generation.current) setPhase("active");
    } catch(e) { if (id === generation.current) fail(e); }
    finally { busy.current = false; }
  }
  async function request() {
    if (busy.current || phase === "active" || phase === "finishing") return;
    const { checkerDownloaded } = await import("@/lib/hifz-ai/assets");
    if (await checkerDownloaded()) await begin(); else setPhase("consent");
  }
  async function stop() {
    if (finishing.current) return;
    finishing.current = true; clearTimer();
    const id = generation.current;
    setPhase("finishing");
    try {
      const f = follow.current; follow.current = null;
      if (f) await f.stop();
      const m = mic.current; mic.current = null;
      if (m) await m.close();
      await queue.current;
      if (id !== generation.current) return;
      if (mode === "search" && recognizer.current) {
        heard.current += (await recognizer.current.flush()).map((e) => e.token).join("");
        const { findInQuran } = await import("@/lib/hifz-ai");
        const result = await findInQuran(heard.current, 3);
        if (id === generation.current) matches.current(result);
      }
      if (id === generation.current) setPhase("idle");
    } catch(e) { if (id === generation.current) fail(e); }
    finally { finishing.current = false; }
  }
  function cancel() { generation.current++; release(); setPhase("idle"); }
  return {phase, progress, error, remaining, request, begin, stop, cancel};
}