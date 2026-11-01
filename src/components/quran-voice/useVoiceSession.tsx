import { useEffect, useRef, useState } from "react";
import type { FollowPosition, FollowSession, SearchAnswer } from "@/lib/hifz-ai";
import { quranPlayer } from "@/lib/quran-player";
import { recitationPlayer } from "@/lib/recitation-player";
import { VOICE_SEARCH_MS } from "./rules";

export type Match = SearchAnswer["matches"][number];
export function useVoiceSession(mode: "follow" | "search", onPosition: (p: FollowPosition) => void, onAnswer: (a: SearchAnswer) => void) {
  const [phase, setPhase] = useState<"idle" | "consent" | "loading" | "active" | "finishing" | "error">("idle");
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const [stream, setStream] = useState<MediaStream | null>(null);
  const position = useRef(onPosition); position.current = onPosition;
  const answer = useRef(onAnswer); answer.current = onAnswer;
  const generation = useRef(0);
  const session = useRef<FollowSession | null>(null);
  const busy = useRef(false);
  const finishing = useRef(false);
  const release = () => {
    const current = session.current; session.current = null;
    if (current) { current.stream.getTracks().forEach((t) => t.stop()); void current.stop().catch(() => undefined); }
  };
  const fail = (e: unknown) => {
    generation.current++; release(); busy.current = false; finishing.current = false; setStream(null);
    const name = e instanceof Error ? e.name : "";
    setError(name === "NotAllowedError" || name === "SecurityError" ? "Microphone access is off. Allow it in your browser or phone settings, then retry." : "Couldn’t start listening. Check your connection and try again.");
    setPhase("error");
  };
  useEffect(() => () => { generation.current++; release(); }, []);
  async function begin() {
    if (busy.current) return;
    busy.current = true; finishing.current = false;
    const id = ++generation.current;
    setPhase("loading"); setError(""); setProgress(0);
    quranPlayer.pause(); recitationPlayer.pause();
    let answered = false;
    try {
      const engine = await import("@/lib/hifz-ai");
      await engine.prepareChecker((p) => { if (id === generation.current) setProgress(p); });
      if (id !== generation.current) return;
      const onError = (e: unknown) => { if (id === generation.current) fail(e); };
      const current = mode === "follow"
        ? await engine.startFollowing({ onPosition: (p) => { if (id === generation.current) position.current(p); }, onError })
        : await engine.startVoiceSearch({ maxSeconds: VOICE_SEARCH_MS / 1000, onError, onAnswer: (a) => {
          if (id !== generation.current) return;
          answered = true; session.current = null; setStream(null); setPhase("idle");
          answer.current(a);
        } });
      if (id !== generation.current) { current.stream.getTracks().forEach((t) => t.stop()); await current.stop(); return; }
      if (!answered) { session.current = current; setStream(current.stream); setPhase("active"); }
    } catch (e) { if (id === generation.current) fail(e); }
    finally { if (id === generation.current) busy.current = false; }
  }
  async function request() {
    if (busy.current || phase === "active" || phase === "finishing") return;
    const { checkerDownloaded } = await import("@/lib/hifz-ai/assets");
    if (await checkerDownloaded()) await begin(); else setPhase("consent");
  }
  async function stop() {
    if (finishing.current) return;
    finishing.current = true;
    const id = generation.current;
    setPhase("finishing");
    const current = session.current; session.current = null;
    try {
      // Stop capture immediately; the engine settles its queued speech and returns its answer.
      current?.stream.getTracks().forEach((t) => t.stop()); setStream(null);
      await current?.stop();
      if (id === generation.current) setPhase("idle");
    } catch (e) { if (id === generation.current) fail(e); }
    finally { finishing.current = false; }
  }
  function cancel() { generation.current++; release(); busy.current = false; setStream(null); setPhase("idle"); }
  return { phase, progress, error, stream, request, begin, stop, cancel };
}
