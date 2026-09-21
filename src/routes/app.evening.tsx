import { createFileRoute } from "@tanstack/react-router";
import { AdhkarPage } from "@/components/AdhkarPage";
import { eveningAdhkar, baqarahLastTwo } from "@/data/adhkar";

export const Route = createFileRoute("/app/evening")({
  head: () => ({
    meta: [
      { title: "Evening Adhkar, Sahih Al-Adhkar" },
      { name: "description", content: "Recite your evening adhkar with counters and streaks." },
      { property: "og:title", content: "Evening Adhkar, Sahih Al-Adhkar" },
      { property: "og:description", content: "Recite your evening adhkar with counters and streaks." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Evening,
});

function Evening() {
  return (
    <AdhkarPage
      storageKey="evening"
      lifetimeCategory="evening"
      title="Evening Adhkar"
      subtitle="Between 'Asr & Maghrib"
      list={eveningAdhkar}
      headerPattern={null}
      extras={[
        { dhikr: baqarahLastTwo, isSpecial: true, specialLabel: "After Sunset. Recite after the sun has set" },
      ]}
    />
  );
}
