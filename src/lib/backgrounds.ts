// Per-theme background artwork. Each preset can supply its own morning and
// evening image; presets without artwork fall back to the default pair.

import morningDefault from "@/assets/morning-landscape.webp.asset.json";
import eveningDefault from "@/assets/evening-landscape.webp.asset.json";
import roseMorning from "@/assets/rose-morning.webp.asset.json";
import roseEvening from "@/assets/rose-evening.webp.asset.json";
import twilightMorning from "@/assets/twilight-morning.webp.asset.json";
import twilightEvening from "@/assets/twilight-evening.webp.asset.json";
import oceanMorning from "@/assets/ocean-morning.webp.asset.json";
import oceanEvening from "@/assets/ocean-evening.webp.asset.json";
import emeraldMorning from "@/assets/emerald-morning.webp.asset.json";
import emeraldEvening from "@/assets/emerald-evening.webp.asset.json";
import sandMorning from "@/assets/sand-morning.webp.asset.json";
import sandEvening from "@/assets/sand-evening.webp.asset.json";
import midnightMorning from "@/assets/midnight-morning.webp.asset.json";
import midnightEvening from "@/assets/midnight-evening.webp.asset.json";
import darkRedMorning from "@/assets/dark-red-morning.png.asset.json";
import darkRedEvening from "@/assets/dark-red-evening.png.asset.json";

export type BackgroundPair = { morning: string; evening: string };

export const DEFAULT_BACKGROUNDS: BackgroundPair = {
  morning: morningDefault.url,
  evening: eveningDefault.url,
};

export const PRESET_BACKGROUNDS: Record<string, BackgroundPair> = {
  original: DEFAULT_BACKGROUNDS,
  rose: { morning: roseMorning.url, evening: roseEvening.url },
  lavender: { morning: twilightMorning.url, evening: twilightEvening.url },
  ocean: { morning: oceanMorning.url, evening: oceanEvening.url },
  emerald: { morning: emeraldMorning.url, evening: emeraldEvening.url },
  sand: { morning: sandMorning.url, evening: sandEvening.url },
  midnight: { morning: midnightMorning.url, evening: midnightEvening.url },
  "dark-red": { morning: darkRedMorning.url, evening: darkRedEvening.url },
};

export const backgroundsForPreset = (presetId: string | null | undefined): BackgroundPair =>
  (presetId && PRESET_BACKGROUNDS[presetId]) || DEFAULT_BACKGROUNDS;
