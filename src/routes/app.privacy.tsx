import { createFileRoute } from "@tanstack/react-router";
import { LegalScreen } from "@/components/LegalScreen";
import { PRIVACY_INTRO, PRIVACY_SECTIONS } from "@/data/legal";

export const Route = createFileRoute("/app/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy, Sahih Al-Adhkar" },
      {
        name: "description",
        content: "How Sahih Al-Adhkar handles your data. Everything stays on your device.",
      },
      { property: "og:title", content: "Privacy Policy, Sahih Al-Adhkar" },
      {
        property: "og:description",
        content: "No data collection. No tracking. Everything stays on your device.",
      },
    ],
  }),
  component: () => (
    <LegalScreen
      title="Privacy Policy"
      intro={PRIVACY_INTRO}
      sections={PRIVACY_SECTIONS}
      webPath="/privacy"
    />
  ),
});
