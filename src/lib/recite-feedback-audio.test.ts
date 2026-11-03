import { expect, test } from "bun:test";
import { createReciteFeedbackAudio } from "./recite-feedback-audio";

test("gesture unlock preloads and plays a live mistake immediately without stopping recording", async () => {
  const originalFetch=globalThis.fetch;
  let resumed=0, started=0, stopped=0;
  const ctx={ state:"running", sampleRate:48000, destination:{},
    resume:async()=>{resumed++;}, createBuffer:()=>({}),
    decodeAudioData:async()=>({duration:0.2}),
    createGain:()=>({gain:{value:1},connect(){},disconnect(){}}),
    createBufferSource:()=>({buffer:null,onended:null,connect(){},disconnect(){},start(){started++;},stop(){stopped++;}}),
  };
  globalThis.fetch=(async()=>new Response(new Uint8Array([1]))) as typeof fetch;
  try {
    const audio=createReciteFeedbackAudio({wrong:"https://example.test/wrong.mp3",micStop:"https://example.test/stop.mp3"},()=>ctx as unknown as AudioContext);
    audio.unlock();
    expect(resumed).toBe(1);
    await new Promise(resolve=>setTimeout(resolve,10));
    audio.play("wrong");
    await new Promise(resolve=>setTimeout(resolve,0));
    expect(started).toBe(2); // Silent unlock + audible live mistake, before mic stop.
    expect(stopped).toBe(0);
    audio.play("micStop");
    await new Promise(resolve=>setTimeout(resolve,0));
    expect(started).toBe(3);
    expect(stopped).toBe(0);
    audio.cancel(); expect(stopped).toBe(2);
  } finally { globalThis.fetch=originalFetch; }
});