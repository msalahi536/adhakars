import { createFileRoute, Link } from "@tanstack/react-router";
import { HeaderBackButton } from "@/components/HeaderBackButton";
import { AI_CREDIT } from "@/lib/hifz-ai/notices";
import { RECITERS, reciterName } from "@/lib/quran";
export const Route = createFileRoute("/app/acknowledgements")({
  head: () => ({ meta: [
    { title: "Acknowledgements · Sahih Al-Adhkar" }, { name: "description", content: "The people, Quran sources, fonts and open-source tools behind Sahih Al-Adhkar." },
    { property: "og:title", content: "Acknowledgements · Sahih Al-Adhkar" }, { property: "og:description", content: "Credits for Quran Foundation, reciters, mushaf fonts and the free recitation checker." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  ] }), component: Acknowledgements,
});
function Acknowledgements() {
  const names = [...new Set(RECITERS.map((r) => reciterName(r)))];
  return <><header className="page-header relative"><HeaderBackButton /><div className="mx-auto max-w-md px-16 pt-9 pb-6 text-center"><div className="label-caps">About</div><h1 className="app-page-title mt-2">Acknowledgements</h1></div></header><main className="scroll-area"><div className="mx-auto max-w-md px-5 py-5 space-y-6 text-foreground">
    <section className="border-b border-border pb-5"><h2 className="font-display text-2xl mb-2">Recitation checking</h2><p className="text-sm leading-relaxed">{AI_CREDIT}</p><p className="text-sm mt-2">This feature is and will remain free.</p><p className="text-xs text-muted-foreground mt-2">Automatic feedback is not a substitute for a qualified teacher.</p></section>
    <section className="border-b border-border pb-5"><h2 className="font-display text-2xl mb-2">Quran Foundation</h2><p className="text-sm leading-relaxed">Quran text, audio and translations are provided by Quran.com (Quran Foundation), including Sahih International English translation.</p></section>
    <section className="border-b border-border pb-5"><h2 className="font-display text-2xl mb-2">Mushaf typography</h2><p className="text-sm leading-relaxed">Mushaf fonts by the King Fahd Glorious Quran Printing Complex.</p></section>
    <section className="border-b border-border pb-5"><h2 className="font-display text-2xl mb-2">ONNX Runtime</h2><p className="text-sm leading-relaxed">onnxruntime-web · Microsoft · MIT License.</p><Link className="text-sm underline mt-2 inline-block" to="/app/licenses">Open-source licenses</Link></section>
    <section><h2 className="font-display text-2xl mb-3">The reciters</h2><ul className="space-y-2 text-sm leading-relaxed">{names.map((name) => <li key={name}>{name}</li>)}</ul></section>
  </div></main></>;
}