import { createFileRoute } from "@tanstack/react-router";
import { LegalScreen } from "@/components/LegalScreen";
import { TERMS_INTRO, TERMS_SECTIONS } from "@/data/legal";

export const Route = createFileRoute("/app/terms")({
  head: () => ({
    meta: [
      { title: "Terms of Service, Sahih Al-Adhkar" },
      {
        name: "description",
        content: "Terms of service for Sahih Al-Adhkar. Free, provided as is, no warranty.",
      },
      { property: "og:title", content: "Terms of Service, Sahih Al-Adhkar" },
      { property: "og:description", content: "Terms of service for Sahih Al-Adhkar." },
    ],
  }),
  component: () => (
    <LegalScreen
      title="Terms of Service"
      intro={TERMS_INTRO}
      sections={TERMS_SECTIONS}
      webPath="/terms"
    />
  ),
});
