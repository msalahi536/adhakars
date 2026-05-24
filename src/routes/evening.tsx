import { createFileRoute } from "@tanstack/react-router";
import { AdhkarPage } from "@/components/AdhkarPage";
import { eveningAdhkar, baqarahLastTwo } from "@/data/adhkar";

export const Route = createFileRoute("/evening")({
  head: () => ({
    meta: [
      { title: "Evening Adhkar — My Adhkar" },
      { name: "description", content: "Recite your evening adhkar with counters and streaks." },
    ],
  }),
  component: Evening,
});

function Evening() {
  return (
    <AdhkarPage
      kind="evening"
      title="Evening"
      subtitle="Between 'Asr & Maghrib"
      list={eveningAdhkar}
      extras={[{ dhikr: baqarahLastTwo, isSpecial: true, specialLabel: "After Sunset — recite after the sun has set" }]}
    />

  );
}
