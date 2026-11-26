import { expect, test } from "bun:test";
import { createRecitationAudioSession } from "./recitation-audio-session";

test("overlapping recitation views share routing until the last microphone ends", async () => {
  let begins = 0, ends = 0;
  const session = createRecitationAudioSession({ begin: async () => { begins++; }, end: async () => { ends++; } });
  const first = await session.acquire(), second = await session.acquire();
  expect(begins).toBe(1);
  await first(); expect(ends).toBe(0);
  await second(); expect(ends).toBe(1);
  await second(); expect(ends).toBe(1);
});
test("routing is restored on cancelled or failed microphone startup", async () => {
  let active = false;
  const session = createRecitationAudioSession({ begin: async () => { active = true; }, end: async () => { active = false; } });
  const release = await session.acquire(); expect(active).toBe(true);
  await release(); expect(active).toBe(false);
});
test("a restart in progress cannot lose speaker routing to a stale release", async () => {
  let ends = 0;
  const session = createRecitationAudioSession({ begin: async () => {}, end: async () => { ends++; } });
  const first = await session.acquire();
  const next = session.acquire();
  const oldStop = first();
  const release = await next; await oldStop;
  expect(ends).toBe(0);
  await release(); expect(ends).toBe(1);
});
