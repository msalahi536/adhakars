import { useId, useLayoutEffect, useRef, useState } from "react";

/** Ornaments keep their own dimensions; only the straight rails grow. */
export function MushafFrame() {
  const ref = useRef<SVGSVGElement>(null);
  const [size, setSize] = useState({ w: 360, h: 600 });
  const id = useId().replace(/:/g, "");
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => { if (entry) setSize({ w: entry.contentRect.width, h: entry.contentRect.height }); });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  const { w, h } = size;
  const horizontal = Array.from({ length: Math.max(1, Math.floor((w - 34) / 25)) }, (_, i) => 22 + i * (w - 44) / Math.max(1, Math.floor((w - 34) / 25) - 1));
  const vertical = Array.from({ length: Math.max(1, Math.floor((h - 34) / 25)) }, (_, i) => 22 + i * (h - 44) / Math.max(1, Math.floor((h - 34) / 25) - 1));
  return <svg ref={ref} className="rc-ornamental-frame" viewBox={`0 0 ${w} ${h}`} aria-hidden="true">
    <defs><g id={`${id}-leaf`}>
      <path d="M-13 0Q-8-12 0-8Q8-12 13 0Q8 12 0 8Q-8 12-13 0Z" className="rc-frame-leaf" />
      <path d="M-11 0Q-3-6 0 0Q3 6 11 0M0-8Q-5 0 0 8" className="rc-frame-vein" />
      <g className="rc-frame-flower"><ellipse cy="-3" rx="2" ry="3"/><ellipse cy="3" rx="2" ry="3"/><ellipse cx="-3" rx="3" ry="2"/><ellipse cx="3" rx="3" ry="2"/></g><circle r="1.4" className="rc-frame-seed" />
    </g></defs>
    <rect x="9" y="9" width={Math.max(0,w-18)} height={Math.max(0,h-18)} className="rc-frame-rail" />
    {horizontal.map((x,i) => <g key={`h${i}`}><use href={`#${id}-leaf`} transform={`translate(${x},10)`}/><use href={`#${id}-leaf`} transform={`translate(${x},${h-10})`}/></g>)}
    {vertical.map((y,i) => <g key={`v${i}`}><use href={`#${id}-leaf`} transform={`translate(10,${y}) rotate(90)`}/><use href={`#${id}-leaf`} transform={`translate(${w-10},${y}) rotate(90)`}/></g>)}
    {[[10,10],[w-10,10],[10,h-10],[w-10,h-10]].map(([x,y],i) => <use key={i} href={`#${id}-leaf`} transform={`translate(${x},${y}) rotate(45) scale(1.25)`}/>)}
    <rect x="22" y="22" width={Math.max(0,w-44)} height={Math.max(0,h-44)} className="rc-frame-inner" />
    <rect x="25" y="25" width={Math.max(0,w-50)} height={Math.max(0,h-50)} className="rc-frame-hairline" />
  </svg>;
}