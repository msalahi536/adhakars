import modelAsset from "./model.onnx.asset.json";
// A new name whenever the model or its answer files change: phones then fetch the new set once,
// instead of mixing a new model with old cached files.
export const MODEL_CACHE = "hifz-ai-model-own-3";
let cleaned = false;
/** Delete caches left by earlier models (the old one was ~73 MB). Runs once per app start. */
async function dropOldCaches() {
  if (cleaned) return;
  cleaned = true;
  try {
    for (const name of await caches.keys()) if (name.startsWith("hifz-ai-model") && name !== MODEL_CACHE) await caches.delete(name);
  } catch { /* no Cache Storage here: nothing to clean */ }
}
export const MODEL_URL = modelAsset.url;
export async function cachedAsset(url: string, onProgress?: (value: number) => void): Promise<Response> {
  await dropOldCaches();
  let cache: Cache | undefined;
  try { cache = await caches.open(MODEL_CACHE); } catch { /* Restricted WebView: network still works. */ }
  const hit = await cache?.match(url);
  if (hit) { onProgress?.(1); return hit; }
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Download failed (${response.status})`);
  if (!onProgress || !response.body) {
    await cache?.put(url, response.clone()).catch(() => undefined);
    return response;
  }
  const total = Number(response.headers.get("content-length")) || 30_000_000;
  const reader = response.body.getReader();
  const chunks: BlobPart[] = [];
  let bytes = 0;
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    chunks.push(value); bytes += value.byteLength;
    onProgress(Math.min(.99, bytes / total));
  }
  const result = new Response(new Blob(chunks), { headers: response.headers });
  await cache?.put(url, result.clone()).catch(() => undefined);
  onProgress(1);
  return result;
}
export async function checkerDownloaded(): Promise<boolean> {
  try { return !!await (await caches.open(MODEL_CACHE)).match(MODEL_URL); } catch { return false; }
}