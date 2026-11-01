import { createFileRoute } from "@tanstack/react-router";
import { LegalScreen } from "@/components/LegalScreen";
import { PRIVACY_INTRO, PRIVACY_SECTIONS } from "@/data/legal";

export const Route = createFileRoute("/app/privacy")({
  head: () => ({
    meta: [
      { title: "App Privacy Policy, Sahih Al-Adhkar" },
      {
        name: "description",
        content: "How Sahih Al-Adhkar handles local data, on-device recitation and optional online submissions.",
      },
      { property: "og:title", content: "App Privacy Policy, Sahih Al-Adhkar" },
      {
        property: "og:description",
        content: "Privacy information for local worship progress, microphone use, external services and optional submissions.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
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
