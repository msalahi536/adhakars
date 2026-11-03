// One gesture-unlocked context keeps asynchronous live feedback playable on Safari.
export function createReciteFeedbackAudio(urls: Partial<Record<string, string>>, contextFactory: () => AudioContext | undefined = () => {
  if (typeof window === "undefined") return;
  const Context = window.AudioContext ?? (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  return Context ? new Context() : undefined;
}) {
  let context: AudioContext | undefined;
  let generation = 0;
  const buffers = new Map<string, Promise<AudioBuffer>>();
  const sources = new Set<AudioBufferSourceNode>();
  function load(url: string, ctx: AudioContext) {
    const cached = buffers.get(url);
    if (cached) return cached;
    const pending = fetch(url).then(response => {
      if (!response.ok) throw new Error("Feedback audio unavailable");
      return response.arrayBuffer();
    }).then(data => ctx.decodeAudioData(data)).catch(error => {
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
    void load(url, ctx).then(buffer => {
      if (token !== generation || ctx.state !== "running") return;
      const source = ctx.createBufferSource(), gain = ctx.createGain();
      gain.gain.value = 0.3;
      source.buffer = buffer;
      source.connect(gain); gain.connect(ctx.destination);
      sources.add(source);
      source.onended = () => { sources.delete(source); source.disconnect(); gain.disconnect(); };
      // Start now: never wait for the recording to end or the result sheet.
      source.start();
    }).catch(() => undefined);
  }
  function cancel() {
    generation++;
    for (const source of sources) { try { source.stop(); } catch { /* Already ended. */ } }
    sources.clear();
  }
  return { unlock, play, cancel };
}