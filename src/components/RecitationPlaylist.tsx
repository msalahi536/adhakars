import { createContext, useContext } from "react";
import { SALAH_PRAYERS } from "@/data/salah";

export type Playlist = { label: string; items: { id: string; title: string }[] };
export const RecitationPlaylistContext = createContext<Playlist | null>(null);
export const usePlaylist = () => useContext(RecitationPlaylistContext);

// The name the phone shows on its lock-screen player. It carries the section
// ("Morning Adhkar") rather than whichever card happens to be playing.
export function playlistLabel(persistKey?: string): string | null {
  if (!persistKey) return null;
  if (persistKey === "morning") return "Morning Adhkar";
  if (persistKey === "evening") return "Evening Adhkar";
  if (persistKey === "sleep") return "Sleep Adhkar";
  if (persistKey === "wake") return "Waking Adhkar";
  if (persistKey.startsWith("salah_")) {
    const prayer = SALAH_PRAYERS.find((p) => p.id === persistKey.slice("salah_".length));
    return `After ${prayer?.label ?? "Salah"} Adhkar`;
  }
  return "Adhkar";
}
