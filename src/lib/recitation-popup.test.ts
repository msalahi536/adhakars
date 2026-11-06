import { expect, test } from "bun:test";
import { closePopup, getLastSection, rememberSection } from "./recitation-popup";

test("direct card playback retains all section tracks for popup forward and back navigation", () => {
  const tracks = [
    { dhikrId: "morning-1", title: "First", url: "/first.mp3" },
    { dhikrId: "morning-2", title: "Second", url: "/second.mp3" },
    { dhikrId: "morning-3", title: "Third", url: "/third.mp3" },
  ];
  rememberSection({ openerId: "morning-1", title: "First", label: "Morning Adhkar", tracks });
  closePopup();
  expect(getLastSection()?.tracks).toEqual(tracks);
  expect(getLastSection()?.tracks[1]?.dhikrId).toBe("morning-2");
  expect(getLastSection()?.label).toBe("Morning Adhkar");
});