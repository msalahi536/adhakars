import { describe, expect, test } from "bun:test";
import { enhancedRecitationUrl } from "./adhkar-audio";

describe("enhanced adhkar recordings", () => {
  test("known signed original uses its separately mastered audio", () => {
    const result = enhancedRecitationUrl("https://example.com/storage/v1/object/sign/recitations/fbdc9b49-14de-4fd7-8085-f716ffb6620b-ayatul-kursi.wav?token=test");
    expect(result).toStartWith("/__l5e/assets-v1/");
    expect(result).toEndWith(".m4a");
  });
  test("new uploads retain the original URL", () => {
    const url = "https://example.com/storage/v1/object/sign/recitations/new-recording.wav?token=test";
    expect(enhancedRecitationUrl(url)).toBe(url);
  });
  test("other audio libraries remain unchanged", () => {
    const url = "https://example.com/quran/fbdc9b49-14de-4fd7-8085-f716ffb6620b-ayatul-kursi.wav";
    expect(enhancedRecitationUrl(url)).toBe(url);
  });
});