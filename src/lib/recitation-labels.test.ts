import { describe, expect, it } from "vitest";
import { playlistLabel } from "@/components/RecitationPlaylist";

describe("playlistLabel", () => {
  it("names the daily sections for the phone player", () => {
    expect(playlistLabel("morning")).toBe("Morning Adhkar");
    expect(playlistLabel("evening")).toBe("Evening Adhkar");
    expect(playlistLabel("sleep")).toBe("Sleep Adhkar");
    expect(playlistLabel("wake")).toBe("Waking Adhkar");
  });

  it("names each after-salah set by its prayer", () => {
    expect(playlistLabel("salah_fajr")).toBe("After Fajr Adhkar");
    expect(playlistLabel("salah_isha")).toBe("After Isha Adhkar");
  });

  it("falls back for unknown sections", () => {
    expect(playlistLabel("something-new")).toBe("Adhkar");
  });
});
