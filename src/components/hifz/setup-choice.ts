export function hasSetupChoice(juz: number[], surahs: number[], startingFresh: boolean): boolean {
  return juz.length > 0 || surahs.length > 0 || startingFresh;
}