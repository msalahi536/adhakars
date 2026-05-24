import { createFileRoute } from "@tanstack/react-router";
import { AdhkarPage } from "@/components/AdhkarPage";
import { morningAdhkar } from "@/data/adhkar";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Morning Adhkar — My Adhkar" },
      { name: "description", content: "Recite your morning adhkar with counters and streaks." },
    ],
  }),
  component: Morning,
});

function Morning() {
  return (
    <AdhkarPage
      kind="morning"
      title="Morning"
      subtitle="Between Fajr & Sunrise"
      list={morningAdhkar}
    />
  );
}
