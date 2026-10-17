import abudawud from "@/assets/hadith-covers/abudawud.png.asset.json";
import bukhari from "@/assets/hadith-covers/bukhari.png.asset.json";
import ibnmajah from "@/assets/hadith-covers/ibnmajah.png.asset.json";
import mishkat from "@/assets/hadith-covers/mishkat.png.asset.json";
import muslim from "@/assets/hadith-covers/muslim.png.asset.json";
import nasai from "@/assets/hadith-covers/nasai.png.asset.json";
import tirmidhi from "@/assets/hadith-covers/tirmidhi.png.asset.json";

// Matched loosely on slug/name so exact hadithapi.com slug formatting never breaks it.
const COVERS: Array<[RegExp, string]> = [
  [/bukhari/i, bukhari.url],
  [/muslim/i, muslim.url],
  [/nasa/i, nasai.url],
  [/dawud|dawood/i, abudawud.url],
  [/tirmidhi/i, tirmidhi.url],
  [/majah/i, ibnmajah.url],
  [/mishkat/i, mishkat.url],
];

export function hadithCover(slug: string | undefined, name: string | undefined): string | undefined {
  const s = `${slug ?? ""} ${name ?? ""}`;
  return COVERS.find(([re]) => re.test(s))?.[1];
}
