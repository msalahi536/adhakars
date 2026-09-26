import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Ban,
  BedDouble,
  BellRing,
  BookOpen,
  CalendarHeart,
  Check,
  CircleDot,
  Compass,
  Hand,
  HeartHandshake,
  Lock,
  Moon,
  Palette,
  ShieldCheck,
  Sparkles,
  Sunrise,
  WifiOff,
} from "lucide-react";
import { MarketingLayout, IPhoneFrame } from "@/components/marketing/MarketingLayout";
import { Button } from "@/components/ui/button";
import heroAsset from "@/assets/homepage-hero.png.asset.json";
import morningAsset from "@/assets/morning-landscape.webp.asset.json";
import eveningAsset from "@/assets/evening-landscape.webp.asset.json";
import roseAsset from "@/assets/rose-morning.webp.asset.json";
import oceanAsset from "@/assets/ocean-morning.webp.asset.json";
import heroEveningScreen from "@/assets/homepage-evening.png.asset.json";
import heroMorningScreen from "@/assets/homepage-morning.png.asset.json";
import heroSalahScreen from "@/assets/homepage-salah.png.asset.json";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Sahih Al-Adhkar — A calm companion for every day" },
      {
        name: "description",
        content:
          "Authentic daily adhkar, prayer times, duas, and gentle Islamic companions in one private, offline-friendly app.",
      },
      { property: "og:title", content: "Sahih Al-Adhkar — A calm companion for every day" },
      {
        property: "og:description",
        content: "Authentic daily remembrance of Allah, sourced from the Sunnah.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: HomePage,
});

const FEATURES = [
  { Icon: Sunrise, title: "Morning & Evening Adhkar", body: "Authentic remembrances for every day, with references." },
  { Icon: Hand, title: "Salah", body: "Prayer times, notifications, and after-salah adhkar." },
  { Icon: CircleDot, title: "Tasbih Counter", body: "A simple counter with haptics and lifetime totals." },
  { Icon: BedDouble, title: "Sleep & Wake", body: "What to say before sleep and upon waking." },
  { Icon: Compass, title: "Qibla Finder", body: "A live compass to find the direction of the Ka'bah." },
  { Icon: BookOpen, title: "Dua Library", body: "50 authentic duas for every feeling and situation." },
  { Icon: CalendarHeart, title: "Period Companion", body: "Cycle tracking with Islamic guidance and reminders." },
  { Icon: HeartHandshake, title: "Hajj & Umrah", body: "Preparation guides, duas, and step-by-step support." },
  { Icon: Moon, title: "Fasting Companion", body: "Hijri fasting calendar and Ramadan tools." },
  { Icon: ShieldCheck, title: "Ruqyah Companion", body: "Daily protection and authentic self-ruqyah." },
  { Icon: BellRing, title: "Gentle Reminders", body: "Choose the reminders and prayer alerts you want." },
  { Icon: Palette, title: "Multiple Themes", body: "Morning, evening, and color themes that suit your style." },
] as const;

const TRUST = [
  { Icon: ShieldCheck, label: "Built on authentic sources", body: "Every dhikr is referenced from trusted hadith collections." },
  { Icon: Lock, label: "Completely private", body: "Your data stays only on your device. No accounts." },
  { Icon: Ban, label: "Free, no ads", body: "A clean, distraction-free experience." },
  { Icon: WifiOff, label: "Works offline", body: "All content stays available wherever you are." },
] as const;

const THEMES = [
  { name: "Morning", image: morningAsset.url },
  { name: "Evening", image: eveningAsset.url },
  { name: "Rose", image: roseAsset.url },
  { name: "Ocean", image: oceanAsset.url },
] as const;

function HomePage() {
  return (
    <MarketingLayout onePage>
      <div id="home" className="marketing-home">
        <section className="marketing-hero">
          <div className="marketing-hero-image" style={{ backgroundImage: `url(${heroAsset.url})` }} />
          <div className="marketing-hero-shade" />
          <div className="marketing-shell marketing-hero-grid">
            <div className="marketing-hero-copy animate-fade-in">
              <p className="marketing-eyebrow">Authentic remembrance, every day</p>
              <h1>
                A calm companion
                <em>for every day.</em>
              </h1>
              <p className="marketing-lead">
                Sahih Al-Adhkar brings authentic daily remembrances, prayer times, and essential tools together in one beautiful, offline app.
              </p>
              <div className="marketing-actions">
                <Button asChild className="marketing-primary-button">
                  <Link to="/app">Open the app <ArrowRight /></Link>
                </Button>
                <Button asChild variant="outline" className="marketing-secondary-button">
                  <a href="#download">Download</a>
                </Button>
              </div>
              <div className="marketing-quick-trust" aria-label="App benefits">
                <span><ShieldCheck />Free forever</span>
                <span><Ban />No ads</span>
                <span><Lock />No accounts</span>
                <span><WifiOff />Works offline</span>
              </div>
            </div>
            <div className="marketing-hero-phones animate-fade-in" aria-label="Sahih Al-Adhkar app screens">
              <div className="marketing-hero-device marketing-hero-device-evening">
                <IPhoneFrame src={heroEveningScreen.url} width="100%" alt="Evening Adhkar screen in Sahih Al-Adhkar" />
              </div>
              <div className="marketing-hero-device marketing-hero-device-morning">
                <IPhoneFrame src={heroMorningScreen.url} width="100%" alt="Morning Adhkar screen in Sahih Al-Adhkar" />
              </div>
              <div className="marketing-hero-device marketing-hero-device-salah">
                <IPhoneFrame src={heroSalahScreen.url} width="100%" alt="Prayer times screen in Sahih Al-Adhkar" />
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="marketing-section marketing-features">
          <div className="marketing-shell">
            <div className="marketing-heading">
              <p className="marketing-eyebrow">Everything you need</p>
              <h2>More than just adhkar.</h2>
              <p>A complete set of tools to help you live with more remembrance, structure, and peace — all in one place.</p>
            </div>
            <div className="marketing-feature-grid">
              {FEATURES.map(({ Icon, title, body }) => (
                <article className="marketing-feature-card" key={title}>
                  <span className="marketing-icon"><Icon /></span>
                  <h3>{title}</h3>
                  <p>{body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="marketing-section marketing-experience">
          <div className="marketing-shell">
            <div className="marketing-heading marketing-heading-centered">
              <p className="marketing-eyebrow">Beautiful and simple</p>
              <h2>A peaceful experience,<em>in every detail.</em></h2>
              <p>Clean, distraction-free design with everything you need, right at your fingertips.</p>
            </div>
            <div className="marketing-showcase">
              <div className="marketing-showcase-note marketing-showcase-note-left">
                <Sparkles />
                <strong>Made for focus</strong>
                <span>Clear Arabic, translation, references, and counters without clutter.</span>
              </div>
              <IPhoneFrame width="min(330px, 78vw)" />
              <div className="marketing-showcase-note marketing-showcase-note-right">
                <Check />
                <strong>Your daily rhythm</strong>
                <span>Move naturally from morning adhkar to salah, evening, and sleep.</span>
              </div>
            </div>
          </div>
        </section>

        <section className="marketing-section marketing-themes">
          <div className="marketing-shell marketing-theme-panel">
            <div className="marketing-theme-copy">
              <p className="marketing-eyebrow">Customize your experience</p>
              <h2>Beautiful themes<br />for every moment.</h2>
              <p>Choose morning, evening, or a color theme that feels right to you.</p>
            </div>
            <div className="marketing-theme-grid">
              {THEMES.map((theme) => (
                <figure key={theme.name}>
                  <div className="marketing-theme-preview" style={{ backgroundImage: `url(${theme.image})` }} />
                  <figcaption>{theme.name}</figcaption>
                </figure>
              ))}
            </div>
          </div>
        </section>

        <section id="about" className="marketing-section marketing-trust">
          <div className="marketing-shell">
            <div className="marketing-heading marketing-heading-centered">
              <p className="marketing-eyebrow">Why Sahih Al-Adhkar</p>
              <h2>Authentic. Private. Always with you.</h2>
            </div>
            <div className="marketing-trust-grid">
              {TRUST.map(({ Icon, label, body }) => (
                <article key={label}>
                  <span className="marketing-icon"><Icon /></span>
                  <h3>{label}</h3>
                  <p>{body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="download" className="marketing-download">
          <div className="marketing-shell marketing-download-panel">
            <div>
              <p className="marketing-eyebrow">Available now</p>
              <h2>Open it today,<br />right in your browser.</h2>
              <p>Use Sahih Al-Adhkar on iPhone, iPad, Android, or desktop. No account needed.</p>
            </div>
            <Button asChild className="marketing-download-button">
              <Link to="/app">Open the app <ArrowRight /></Link>
            </Button>
          </div>
        </section>
      </div>
    </MarketingLayout>
  );
}
