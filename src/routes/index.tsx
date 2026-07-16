import { createFileRoute } from "@tanstack/react-router";
import { AdhkarPage } from "@/components/AdhkarPage";
import { GirihStarPattern } from "@/components/HeaderPatterns";
import { morningAdhkar } from "@/data/adhkar";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Morning Adhkar, Sahih al-Adhkar" },
      { name: "description", content: "Recite your morning adhkar with counters and streaks." },
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
      headerPattern={<GirihStarPattern />}
    />
  );
}
