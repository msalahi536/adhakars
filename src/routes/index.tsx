import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { AdhkarPage } from "@/components/AdhkarPage";
import { DhikrCard } from "@/components/DhikrCard";
import { morningAdhkar } from "@/data/adhkar";
import { getCounts } from "@/lib/storage";

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
  // ensure storage rehydrates on focus
  const [, setT] = useState(0);
  useEffect(() => {
    const f = () => setT((x) => x + 1);
    window.addEventListener("focus", f);
    return () => window.removeEventListener("focus", f);
  }, []);
  // unused but keeps imports happy if needed
  void getCounts;
  void DhikrCard;
  return (
    <AdhkarPage
      kind="morning"
      title="Morning"
      subtitle="Between Fajr & Sunrise"
      list={morningAdhkar}
    />
  );
}
