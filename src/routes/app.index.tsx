import { createFileRoute } from "@tanstack/react-router";
import { AdhkarPage } from "@/components/AdhkarPage";
import { morningAdhkar } from "@/data/adhkar";

export const Route = createFileRoute("/app/")({
  head: () => ({
    meta: [
      { title: "Morning Adhkar, Sahih Al-Adhkar" },
      { name: "description", content: "Recite your morning adhkar with counters and streaks." },
      { property: "og:title", content: "Morning Adhkar, Sahih Al-Adhkar" },
      { property: "og:description", content: "Recite your morning adhkar with counters and streaks." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Morning,
});

function Morning() {
  return (
    <AdhkarPage
      storageKey="morning"
      lifetimeCategory="morning"
      title="Morning Adhkar"
      subtitle="Between Fajr & Sunrise"
      list={morningAdhkar}
      headerPattern={null}
    />
  );
}
