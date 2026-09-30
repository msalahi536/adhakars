// One shared audio player for card recitations. Lives outside React so audio
// keeps playing when the page changes or the app goes to the background.
import { useSyncExternalStore } from "react";
import { getRecitations } from "./recitations.functions";

export type Track = { dhikrId: string; title: string; url: string };
export type PlayerState = {
  track: Track | null;
  playing: boolean;
  current: number;
  duration: number;
  queue: Track[];
  queueIndex: number;
  queueLabel: string | null;
};

let state: PlayerState = { track: null, playing: false, current: 0, duration: 0, queue: [], queueIndex: -1, queueLabel: null };
const subs = new Set<() => void>();
const set = (p: Partial<PlayerState>) => { state = { ...state, ...p }; subs.forEach((f) => f()); };

let audio: HTMLAudioElement | null = null;
function el() {
  if (audio) return audio;
  audio = new Audio();
  audio.preload = "auto";
  audio.setAttribute("playsinline", "");
  audio.addEventListener("timeupdate", () => set({ current: audio!.currentTime }));
  audio.addEventListener("loadedmetadata", () => set({ duration: audio!.duration || 0 }));
  audio.addEventListener("play", () => set({ playing: true }));
  audio.addEventListener("pause", () => set({ playing: false }));
  audio.addEventListener("ended", () => {
    if (state.queue.length && state.queueIndex < state.queue.length - 1) load(state.queueIndex + 1);
    else set({ playing: false, current: 0, queue: [], queueIndex: -1, queueLabel: null });
  });
  const ms = typeof navigator !== "undefined" ? navigator.mediaSession : undefined;
  if (ms) {
    ms.setActionHandler("play", () => void audio!.play());
    ms.setActionHandler("pause", () => audio!.pause());
    ms.setActionHandler("nexttrack", () => { if (state.queueIndex < state.queue.length - 1) load(state.queueIndex + 1); });
    ms.setActionHandler("previoustrack", () => { if (state.queueIndex > 0) load(state.queueIndex - 1); });
    ms.setActionHandler("seekto", (d) => { if (d.seekTime != null) audio!.currentTime = d.seekTime; });
  }
  return audio;
}

function start(track: Track) {
  const a = el();
  a.src = track.url;
  set({ track, current: 0, duration: 0 });
  void a.play().catch(() => set({ playing: false }));
  if (navigator.mediaSession && "MediaMetadata" in window) {
    navigator.mediaSession.metadata = new MediaMetadata({
      title: track.title,
      artist: state.queueLabel ? `Sahih Al-Adhkar · ${state.queueLabel}` : "Sahih Al-Adhkar",
    });
  }
  window.dispatchEvent(new CustomEvent("recitation:track", { detail: track.dhikrId }));
}

function load(i: number) {
  set({ queueIndex: i });
  start(state.queue[i]);
}

export const recitationPlayer = {
  playOne(track: Track) {
    set({ queue: [], queueIndex: -1, queueLabel: null });
    start(track);
  },
  playAll(tracks: Track[], label: string, startAt = 0) {
    if (!tracks.length) return;
    set({ queue: tracks, queueLabel: label });
    load(Math.min(startAt, tracks.length - 1));
  },
  toggle() {
    const a = el();
    if (a.paused) void a.play(); else a.pause();
  },
  seek(t: number) { el().currentTime = t; set({ current: t }); },
};

export function usePlayer() {
  return useSyncExternalStore(
    (f) => { subs.add(f); return () => subs.delete(f); },
    () => state,
    () => state,
  );
}

// Recitation url map, fetched once per app open.
type Map_ = Record<string, { url: string; name: string }>;
let mapPromise: Promise<Map_> | null = null;
let mapCache: Map_ | null = null;
const mapSubs = new Set<() => void>();
export function loadRecitations() {
  if (!mapPromise) {
    mapPromise = getRecitations()
      .catch(() => ({}) as Map_)
      .then((m) => { mapCache = m; mapSubs.forEach((f) => f()); return m; });
  }
  return mapPromise;
}
export function useRecitationMap(): Map_ | null {
  return useSyncExternalStore(
    (f) => { mapSubs.add(f); void loadRecitations(); return () => mapSubs.delete(f); },
    () => mapCache,
    () => null,
  );
}
