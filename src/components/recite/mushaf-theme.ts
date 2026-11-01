// App preset names differ from two names in the immutable supplied manifest.
export function mushafThemeId(preset: string): string {
  return preset === "lavender" ? "twilight" : preset === "dark-red" ? "darkred" : preset;
}