import { createServerFn } from "@tanstack/react-start";

const TROY_OZ = 31.1035;
type Snapshot = { goldUsdPerGram: number; silverUsdPerGram: number; fx: Record<string, number>; updatedAt: string };
let cache: { at: number; data: Snapshot } | null = null;
let fxCache: { at: number; rates: Record<string, number> } | null = null;

/** Live gold, silver and currency rates. Cached in memory: metals 6 hours, FX one day. */
export const getZakatPrices = createServerFn({ method: "GET" }).handler(async (): Promise<Snapshot> => {
  const now = Date.now();
  if (cache && now - cache.at < 6 * 3600_000) return cache.data;
  const [g, s] = await Promise.all([
    fetch("https://api.gold-api.com/price/XAU").then((r) => r.json() as Promise<{ price: number }>),
    fetch("https://api.gold-api.com/price/XAG").then((r) => r.json() as Promise<{ price: number }>),
  ]);
  if (!fxCache || now - fxCache.at > 24 * 3600_000) {
    try {
      const fx = (await fetch("https://open.er-api.com/v6/latest/USD").then((r) => r.json())) as { rates?: Record<string, number> };
      if (fx.rates) fxCache = { at: now, rates: fx.rates };
    } catch {
      // keep previous FX
    }
  }
  if (!g?.price || !s?.price) throw new Error("Prices unavailable");
  const data: Snapshot = {
    goldUsdPerGram: g.price / TROY_OZ,
    silverUsdPerGram: s.price / TROY_OZ,
    fx: fxCache?.rates ?? { USD: 1 },
    updatedAt: new Date().toISOString(),
  };
  cache = { at: now, data };
  return data;
});
