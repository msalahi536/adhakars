import modelAsset from "./model.onnx.asset.json";
export const MODEL_CACHE = "hifz-ai-model-v3.2";
export const MODEL_URL = modelAsset.url;
export async function cachedAsset(url: string, onProgress?: (value: number) => void): Promise<Response> {
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
  const total = Number(response.headers.get("content-length")) || 73_000_000;
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