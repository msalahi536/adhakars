import {useEffect,useRef} from "react";
export function SilenceMonitor({stream,onSilence}:{stream:MediaStream|null;onSilence:(lastVoice:number)=>void}){
  const callback=useRef(onSilence);callback.current=onSilence;
  useEffect(()=>{
    if(!stream)return;const Context=window.AudioContext??(window as typeof window&{webkitAudioContext?:typeof AudioContext}).webkitAudioContext;if(!Context)return;
    const context=new Context();void context.resume();const source=context.createMediaStreamSource(stream),analyser=context.createAnalyser();analyser.fftSize=256;source.connect(analyser);
    const samples=new Float32Array(256);let frame=0,last=Date.now();
    const tick=()=>{analyser.getFloatTimeDomainData(samples);if(Math.sqrt(samples.reduce((s,v)=>s+v*v,0)/samples.length)>.012)last=Date.now();callback.current(last);frame=requestAnimationFrame(tick);};tick();
    return()=>{cancelAnimationFrame(frame);source.disconnect();void context.close();};
  },[stream]);return null;
}