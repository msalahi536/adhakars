/** Compact reference labels; full grading remains in the hadith details. */
export function adhkarSourceLabel(source: string) {
  return source.split(/\s*·\s*/)
    .map((part) => part.split(/\s+[–—-]\s+(?=(?:sahih|hasan|da['’]?if)\b)/i)[0] ?? "")
    .filter((part) => !/^(?:sahih|hasan|da['’]?if|weak|authentic|addition|jayyid)\b/i.test(part.trim()))
    .map((part) => part.trim())
    .filter(Boolean)
    .join(" · ");
}