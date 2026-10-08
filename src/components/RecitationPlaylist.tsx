import { createContext, useContext } from "react";

export type Playlist = { label: string; items: { id: string; title: string }[] };
export const RecitationPlaylistContext = createContext<Playlist | null>(null);
export const usePlaylist = () => useContext(RecitationPlaylistContext);

export function playlistLabel(persistKey?: string): string | null {
  if (!persistKey) return null;
  if (persistKey === "morning") return "morning adhkar";
  if (persistKey === "evening") return "evening adhkar";
  if (persistKey === "sleep") return "sleep adhkar";
  if (persistKey === "wake") return "waking adhkar";
  if (persistKey.startsWith("salah_")) return "after salah adhkar";
  return "adhkar";
}
