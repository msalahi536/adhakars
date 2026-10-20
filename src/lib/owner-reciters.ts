// Recitations supplied by the app owner, hosted on the app's CDN.
import type { Reciter } from "./quran";
import pointers from "./owner-reciters-files.json";

const files: Record<number, string> = Object.fromEntries(Object.entries(pointers).map(([k, v]) => [Number(k), v as string]));

export const OWNER_RECITERS: Reciter[] = [
  { id: 200001, name: "Muhammad Aba Al-Hasan", sync: "none", group: 1, files, surahs: Object.keys(files).join(",") },
];
