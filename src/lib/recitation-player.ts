// One shared audio player for card recitations. Lives outside React so audio
// keeps playing when the page changes or the app goes to the background.
import { useSyncExternalStore } from "react";
import { getRecitations } from "./recitations.functions";
import { createBandSampler, METER_FFT_SIZE, spectrumBands, restingLevels, shapeMeter, type MeterLevels } from "./recitation-meter";

export type Track = { dhikrId: string; title: string; url: string };
export type PlayerState = {
  track: Track | null;
  playing: boolean;
  current: number;
  duration: number;
  queue: Track[];
  queueIndex: number;
  queueLabel: string | null;
  levels: MeterLevels;
};

let state: PlayerState = { track: null, playing: false, current: 0, duration: 0, queue: [], queueIndex: -1, queueLabel: null, levels: restingLevels() };
const subs = new Set<() => void>();
const set = (p: Partial<PlayerState>) => { state = { ...state, ...p }; subs.forEach((f) => f()); };

let audio: HTMLAudioElement | null = null;
let audioContext: AudioContext | null = null;
let analyser: AnalyserNode | null = null;
let analyserData: Float32Array<ArrayBuffer> | null = null;
let meterFrame: number | null = null;
let lastMeterTime: number | null = null;

function updateMeter(bands: MeterLevels, now: number) {
  const elapsed = lastMeterTime === null ? 16 : Math.min(64, now - lastMeterTime);
  lastMeterTime = now;
  set({ levels: shapeMeter(bands, state.levels, elapsed) });
}

function stopMeter() {
  if (meterFrame != null) cancelAnimationFrame(meterFrame);
  meterFrame = null;
  lastMeterTime = null;
  set({ levels: restingLevels() });
}

function runMeter(now: number) {
  if (!analyser || !analyserData || !audio || audio.paused) return;
  analyser.getFloatFrequencyData(analyserData);
  updateMeter(spectrumBands(analyserData, audioContext?.sampleRate ?? 48000, analyser.fftSize), now);
  meterFrame = requestAnimationFrame(runMeter);
}

// Routing audio through Web Audio makes phones pause it when the app is
// minimized, so on phones/native we animate the bars without touching the audio.
function canAnalyse() {
  if (typeof window === "undefined") return false;
  const w = window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } };
  if (w.Capacitor?.isNativePlatform?.()) return false;
  return !/iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
}

// Phones: decode the recording separately (never touching playback) into a
// six-band spectral envelope, then drive each bar at playback's currentTime.
const ENV_STEP = 0.03; // seconds per envelope frame
const envelopes = new Map<string, Float32Array | null>();
const envelopeLoads = new Map<string, Promise<void>>();

function loadEnvelope(url: string) {
  if (envelopes.has(url) || envelopeLoads.has(url)) return;
  const job = (async () => {
    try {
      const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctx) throw new Error("no audio");
      const buf = await (await fetch(url)).arrayBuffer();
      const ctx = new Ctx();
      const decoded = await new Promise<AudioBuffer>((res, rej) => ctx.decodeAudioData(buf, res, rej));
      void ctx.close?.();
      const data = decoded.getChannelData(0);
      const win = Math.max(1, Math.floor(decoded.sampleRate * ENV_STEP));
      const frames = Math.ceil(data.length / win);
      const env = new Float32Array(frames * 6);
      const sampleBands = createBandSampler(decoded.sampleRate);
      for (let f = 0; f < frames; f += 1) {
        env.set(sampleBands(data, Math.max(0, f * win - METER_FFT_SIZE / 2)), f * 6);
        // Keep navigation and playback responsive during separate analysis.
        if (f % 100 === 99) await new Promise<void>((resolve) => setTimeout(resolve, 0));
      }
      envelopes.set(url, env);
    } catch {
      envelopes.set(url, null);
    } finally {
      envelopeLoads.delete(url);
    }
  })();
  envelopeLoads.set(url, job);
}

function runSynthMeter(now: number) {
  if (!audio || audio.paused) return;
  const currentTime = audio.currentTime;
  const env = state.track ? envelopes.get(state.track.url) : undefined;
  if (env) {
    const position = currentTime / ENV_STEP;
    const frame = Math.floor(position);
    const at = (index: number, band: number) => env[Math.max(0, Math.min(env.length / 6 - 1, index)) * 6 + band] ?? 0;
    const bands = Array.from({ length: 6 }, (_, band) => at(frame, band) + (at(frame + 1, band) - at(frame, band)) * (position - frame)) as MeterLevels;
    updateMeter(bands, now);
  } else {
    updateMeter([0, 0, 0, 0, 0, 0], now);
  }
  meterFrame = requestAnimationFrame(runSynthMeter);
}

function startMeter() {
  if (!audio) return;
  if (!canAnalyse()) {
    if (state.track) loadEnvelope(state.track.url);
    if (meterFrame == null) meterFrame = requestAnimationFrame(runSynthMeter);
    return;
  }
  try {
    if (!audioContext) {
      audioContext = new AudioContext();
      analyser = audioContext.createAnalyser();
      analyser.fftSize = METER_FFT_SIZE;
      analyser.smoothingTimeConstant = 0.15;
      const source = audioContext.createMediaElementSource(audio);
      source.connect(analyser);
      analyser.connect(audioContext.destination);
      analyserData = new Float32Array(analyser.frequencyBinCount);
    }
    void audioContext.resume();
    if (meterFrame == null) meterFrame = requestAnimationFrame(runMeter);
  } catch {
    // Playback remains available if a browser does not expose audio analysis.
  }
}

function el() {
  if (audio) return audio;
  audio = new Audio();
  audio.crossOrigin = "anonymous";
  audio.preload = "auto";
  audio.setAttribute("playsinline", "");
  audio.addEventListener("timeupdate", () => set({ current: audio?.currentTime ?? 0 }));
  audio.addEventListener("loadedmetadata", () => set({ duration: audio?.duration || 0 }));
  audio.addEventListener("play", () => { set({ playing: true }); startMeter(); });
  audio.addEventListener("pause", () => { set({ playing: false }); stopMeter(); });
  audio.addEventListener("ended", () => {
    if (state.queue.length && state.queueIndex < state.queue.length - 1) load(state.queueIndex + 1);
    else set({ playing: false, current: 0, queue: [], queueIndex: -1, queueLabel: null });
  });
  const ms = typeof navigator !== "undefined" ? navigator.mediaSession : undefined;
  if (ms) {
    ms.setActionHandler("play", () => void audio?.play());
    ms.setActionHandler("pause", () => audio?.pause());
    ms.setActionHandler("nexttrack", () => { if (state.queueIndex < state.queue.length - 1) load(state.queueIndex + 1); });
    ms.setActionHandler("previoustrack", () => { if (state.queueIndex > 0) load(state.queueIndex - 1); });
    ms.setActionHandler("seekto", (d) => { if (d.seekTime != null && audio) audio.currentTime = d.seekTime; });
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
  stop() {
    const a = audio;
    if (a) {
      a.pause();
      a.removeAttribute("src");
      a.load();
    }
    stopMeter();
    set({ track: null, playing: false, current: 0, duration: 0, queue: [], queueIndex: -1, queueLabel: null });
    if (typeof navigator !== "undefined" && navigator.mediaSession) navigator.mediaSession.metadata = null;
  },
  previous() {
    if (state.queueIndex <= 0) return;
    load(state.queueIndex - 1);
  },
  next() {
    if (state.queueIndex < 0 || state.queueIndex >= state.queue.length - 1) return;
    load(state.queueIndex + 1);
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
