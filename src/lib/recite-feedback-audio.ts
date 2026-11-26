// Peak normalization leaves output headroom; silence is never amplified.
export function feedbackPeak(buffer: AudioBuffer) {
  let peak = 0;
  for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
    for (const sample of buffer.getChannelData(channel)) peak = Math.max(peak, Math.abs(sample));
  }
  return peak;
}
export function feedbackGain(peak: number, voices = 1) {
  return peak > 0 && Number.isFinite(peak) ? 0.98 / (peak * Math.max(1, voices)) : 0;
}
// One gesture-unlocked context keeps asynchronous live feedback playable on Safari.
export function createReciteFeedbackAudio(urls: Partial<Record<string, string>>, contextFactory: () => AudioContext | undefined = () => {
  if (typeof window === "undefined") return;
  const Context = window.AudioContext ?? (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  return Context ? new Context() : undefined;
}) {
  let context: AudioContext | undefined;
  let generation = 0;
  const buffers = new Map<string, Promise<AudioBuffer>>();
  const sources = new Map<AudioBufferSourceNode, { gain: GainNode; peak: number }>();
  const peaks = new WeakMap<AudioBuffer, number>();
  const balance = () => {
    for (const { gain, peak } of sources.values()) gain.gain.value = feedbackGain(peak, sources.size);
  };
  function load(url: string, ctx: AudioContext) {
    const cached = buffers.get(url);
    if (cached) return cached;
    const pending = fetch(url).then(response => {
      if (!response.ok) throw new Error("Feedback audio unavailable");
      return response.arrayBuffer();
    }).then(data => ctx.decodeAudioData(data)).then(buffer => {
      peaks.set(buffer, feedbackPeak(buffer));
      return buffer;
    }).catch(error => {
      buffers.delete(url);
      throw error;
    });
    buffers.set(url, pending);
    return pending;
  }
  function unlock() {
    context ??= contextFactory();
    const ctx = context;
    if (!ctx) return;
    // Resume synchronously from the tap, before microphone/model awaits.
    void ctx.resume().catch(() => undefined);
    const silent = ctx.createBufferSource();
    silent.buffer = ctx.createBuffer(1, 1, ctx.sampleRate);
    silent.connect(ctx.destination);
    silent.start();
    for (const url of Object.values(urls)) if (url) void load(url, ctx).catch(() => undefined);
  }
  function play(event: string) {
    const ctx = context, url = urls[event], token = generation;
    if (!ctx || !url) return;
    void Promise.all([load(url, ctx), ctx.state === "running" ? Promise.resolve() : ctx.resume()]).then(([buffer]) => {
      if (token !== generation || ctx.state !== "running") return;
      const source = ctx.createBufferSource(), gain = ctx.createGain();
      source.buffer = buffer;
      source.connect(gain); gain.connect(ctx.destination);
      sources.set(source, { gain, peak: peaks.get(buffer) ?? feedbackPeak(buffer) });
      balance();
      source.onended = () => { sources.delete(source); source.disconnect(); gain.disconnect(); balance(); };
      // Start now: never wait for the recording to end or the result sheet.
      source.start();
    }).catch(() => undefined);
  }
  function cancel() {
    generation++;
    for (const [source, { gain }] of sources) { try { source.stop(); } catch { /* Already ended. */ } source.disconnect(); gain.disconnect(); }
    sources.clear();
  }
  return { unlock, play, cancel };
}