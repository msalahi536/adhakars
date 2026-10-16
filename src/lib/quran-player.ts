import { useSyncExternalStore } from "react";
import { findReciter, getChapterAudio, getChapters, locate, reciterName, reciterPhoto, type ChapterAudio } from "@/lib/quran";

/**
 * App-wide Quran player. Lives outside any route so recitation keeps playing
 * while the user moves between pages; the reader and the floating mini player
 * both subscribe to this one store.
 */
export type QuranPlayerState = {
  chapter: number | null;
  chapterName: string;
  reciterId: number;
  audio: ChapterAudio | null;
  playing: boolean;
  loading: boolean;
  cur: number;
  dur: number;
  repeat: boolean;
  shuffle: boolean;
  rate: number;
  panelOpen: boolean;
  pos: { key: string | null; word: number | null };
};

export const SPEEDS = [0.75, 1, 1.25, 1.5, 2];
const LAST = "adhkar:quran:last";

let state: QuranPlayerState = {
  chapter: null, chapterName: "", reciterId: 7, audio: null, playing: false, loading: false,
  cur: 0, dur: 0, repeat: false, shuffle: false, rate: 1, panelOpen: true, pos: { key: null, word: null },
};
const listeners = new Set<() => void>();
const set = (p: Partial<QuranPlayerState>) => { state = { ...state, ...p }; listeners.forEach((l) => l()); };

let el: HTMLAudioElement | null = null;
let raf = 0;
let reqId = 0;
// True while the listener wants audio playing; lets us recover from stops the
// listener didn't ask for (phone dropping the stream, network stalls, interruptions).
let wanted = false;
let retries = 0;
let lastSave = 0;
let resumeAt: number | null = null;

function saveListen(force = false) {
  if (!el || !state.chapter || !state.audio) return;
  const now = Date.now();
  if (!force && now - lastSave < 2000) return;
  lastSave = now;
  const v = state.pos.key ? Number(state.pos.key.split(":")[1]) : 1;
  try { localStorage.setItem(LAST, JSON.stringify({ s: state.chapter, v, t: el.currentTime, r: state.reciterId, mode: "listen" })); } catch { /* ignore */ }
}

function recover() {
  if (!wanted || !el || !state.audio || retries > 5) return;
  retries += 1;
  const t = el.currentTime;
  const a = el;
  setTimeout(() => {
    if (!wanted || a !== el || !state.audio) return;
    if (a.error || a.networkState === 3) { resumeAt = t; a.src = state.audio.url; a.load(); }
    void a.play().catch(() => {});
  }, 800 * retries);
}

function tick() {
  if (el && state.audio) {
    const found = locate(state.audio.timings, el.currentTime * 1000);
    const next = found.key ? found : state.pos;
    if (next.key !== state.pos.key || next.word !== state.pos.word) {
      set({ pos: next });
      if (next.key) saveListen(true);
    }
  }
  raf = requestAnimationFrame(tick);
}

function audioEl(): HTMLAudioElement {
  if (el) return el;
  el = new Audio();
  el.preload = "auto";
  el.setAttribute("playsinline", "");
  el.onplaying = () => { retries = 0; set({ playing: true, loading: false }); cancelAnimationFrame(raf); raf = requestAnimationFrame(tick); setMediaState("playing"); };
  el.onwaiting = () => set({ loading: true });
  el.onpause = () => {
    saveListen(true);
    // Not asked for by the listener and not the end of the surah: try to carry on.
    if (wanted && el && !el.ended) { recover(); return; }
    set({ playing: false }); cancelAnimationFrame(raf); setMediaState("paused");
  };
  el.onerror = () => recover();
  el.onstalled = () => { if (wanted && el?.paused) recover(); };
  el.ontimeupdate = () => { if (el) set({ cur: el.currentTime, dur: el.duration || 0 }); updatePosition(); saveListen(); };
  el.onloadedmetadata = () => {
    if (!el) return;
    el.playbackRate = state.rate;
    if (resumeAt != null) { el.currentTime = Math.min(resumeAt, (el.duration || resumeAt) - 0.5); resumeAt = null; }
    set({ cur: el.currentTime, dur: el.duration || 0 });
  };
  el.onended = () => { wanted = state.repeat || state.shuffle; void onEnded(); };
  // Coming back to the app: if playback was dropped behind our back, pick it up again.
  document.addEventListener("visibilitychange", () => { if (wanted && el?.paused && !el.ended) { retries = 0; recover(); } });
  const ms = navigator.mediaSession;
  if (ms) {
    const h = (a: MediaSessionAction, f: MediaSessionActionHandler) => { try { ms.setActionHandler(a, f); } catch { /* unsupported */ } };
    h("play", () => void quranPlayer.toggle(true));
    h("pause", () => quranPlayer.pause());
    h("previoustrack", () => quranPlayer.step(-1));
    h("nexttrack", () => quranPlayer.step(1));
    h("seekto", (d) => { if (d.seekTime != null && el) el.currentTime = d.seekTime; });
  }
  return el;
}

function setMediaState(s: MediaSessionPlaybackState) { try { if (navigator.mediaSession) navigator.mediaSession.playbackState = s; } catch { /* ignore */ } }
function updatePosition() {
  try {
    if (el && navigator.mediaSession?.setPositionState && Number.isFinite(el.duration) && el.duration > 0)
      navigator.mediaSession.setPositionState({ duration: el.duration, position: Math.min(el.currentTime, el.duration), playbackRate: el.playbackRate });
  } catch { /* ignore */ }
}
function setMetadata() {
  if (typeof window === "undefined" || !navigator.mediaSession || !("MediaMetadata" in window) || !state.chapter) return;
  const r = findReciter(state.reciterId);
  const photo = reciterPhoto(r);
  navigator.mediaSession.metadata = new MediaMetadata({
    title: `Surah ${state.chapterName || state.chapter}`,
    artist: reciterName(r),
    album: "Sahih Al-Adhkar · Quran",
    artwork: photo ? [{ src: photo, sizes: "512x512", type: photo.endsWith(".png") ? "image/png" : "image/jpeg" }] : [],
  });
}

async function onEnded() {
  if (!el) return;
  if (state.repeat) {
    // Manual restart instead of audio.loop: avoids the stale highlight/scroll jump at the seam.
    set({ pos: { key: null, word: null } });
    el.currentTime = 0;
    void el.play().catch(() => {});
    return;
  }
  set({ playing: false, pos: { key: null, word: null } });
  if (state.shuffle) {
    let n = state.chapter ?? 1;
    while (n === state.chapter) n = 1 + Math.floor(Math.random() * 114);
    const name = (await getChapters().catch(() => [])).find((c) => c.id === n)?.name_simple ?? "";
    await quranPlayer.select(state.reciterId, n, name, true);
  }
}

export const quranPlayer = {
  get: () => state,
  subscribe(l: () => void) { listeners.add(l); return () => { listeners.delete(l); }; },

  /** Load a surah/reciter. Keeps the current audio if it already matches. */
  async select(reciterId: number, chapter: number, chapterName: string, autoplay = false, fromKey?: string) {
    if (state.chapter === chapter && state.reciterId === reciterId && state.audio) {
      if (chapterName && chapterName !== state.chapterName) set({ chapterName });
      if (autoplay) quranPlayer.play(fromKey);
      return;
    }
    if (state.chapter === chapter && state.reciterId === reciterId && state.loading && !autoplay) return;
    const id = ++reqId;
    wanted = false; resumeAt = null;
    el?.pause();
    set({ chapter, chapterName, reciterId, audio: null, cur: 0, dur: 0, playing: false, loading: autoplay, pos: { key: null, word: null } });
    try {
      const audio = await getChapterAudio(reciterId, chapter);
      if (id !== reqId) return;
      const a = audioEl();
      a.src = audio.url;
      a.playbackRate = state.rate;
      set({ audio });
      setMetadata();
      if (autoplay) quranPlayer.play(fromKey);
    } catch { if (id === reqId) set({ loading: false }); }
  },
  play(fromKey?: string) {
    if (!state.audio) return;
    const a = audioEl();
    const t = fromKey ? state.audio.timings.find((x) => x.key === fromKey) : null;
    if (t) a.currentTime = t.from / 1000;
    a.playbackRate = state.rate;
    wanted = true; retries = 0;
    set({ loading: true });
    setMetadata();
    void a.play().catch(() => set({ loading: false }));
  },
  toggle(forcePlay = false) {
    if (!state.audio) return;
    if (state.playing && !forcePlay) quranPlayer.pause(); else quranPlayer.play();
  },
  step(dir: 1 | -1) {
    if (!state.audio || !el) return;
    const ts = state.audio.timings;
    if (!ts.length) { el.currentTime = Math.max(0, el.currentTime + dir * 10); return; }
    const i = ts.findIndex((t) => t.key === state.pos.key);
    const n = ts[Math.min(ts.length - 1, Math.max(0, (i < 0 ? 0 : i) + dir))];
    if (n) quranPlayer.play(n.key);
  },
  seek(ratio: number) {
    if (!el || !Number.isFinite(el.duration)) return;
    el.currentTime = ratio * el.duration;
    set({ cur: el.currentTime, dur: el.duration });
  },
  cycleRate() {
    const rate = SPEEDS[(SPEEDS.indexOf(state.rate) + 1) % SPEEDS.length];
    if (el) el.playbackRate = rate;
    set({ rate }); updatePosition();
  },
  toggleRepeat() { set({ repeat: !state.repeat, shuffle: state.repeat ? state.shuffle : false }); },
  toggleShuffle() { set({ shuffle: !state.shuffle, repeat: state.shuffle ? state.repeat : false }); },
  setPanel(panelOpen: boolean) { set({ panelOpen }); },
  setName(chapterName: string) { if (chapterName !== state.chapterName) { set({ chapterName }); setMetadata(); } },
  /** Play from a saved second (listening progress). */
  playAt(seconds: number) {
    if (!state.audio) return;
    const a = audioEl();
    if (a.readyState >= 1) a.currentTime = seconds; else resumeAt = seconds;
    quranPlayer.play();
  },
  pause() { wanted = false; el?.pause(); },
  stop() {
    wanted = false;
    el?.pause();
    set({ chapter: null, audio: null, playing: false, cur: 0, dur: 0, pos: { key: null, word: null } });
    try { if (navigator.mediaSession) navigator.mediaSession.metadata = null; } catch { /* ignore */ }
  },
};

const serverSnap = () => state;
export function useQuranPlayer(): QuranPlayerState {
  return useSyncExternalStore(quranPlayer.subscribe, quranPlayer.get, serverSnap);
}
