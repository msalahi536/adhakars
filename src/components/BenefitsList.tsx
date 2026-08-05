import { Shield, Sparkles } from "lucide-react";
import { BENEFITS_INCREASES, BENEFITS_PROTECTS } from "@/data/benefits";

type Props = { scroll?: boolean };

const listClass = "mt-2 space-y-1 text-[13px] leading-snug";
const itemClass = "flex items-start gap-2";
const dotClass = "mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full";
const headingClass = "label-caps flex items-center gap-2";

function Group({ icon, heading, items }: { icon: React.ReactNode; heading: string; items: string[] }) {
  return (
    <div className="mt-3 first:mt-0">
      <div className={headingClass} style={{ color: "var(--accent)", opacity: 1 }}>
        {icon}
        {heading}
      </div>
      <ul className={listClass} style={{ color: "var(--muted-foreground)" }}>
        {items.map((t) => (
          <li key={t} className={itemClass}>
            <span className={dotClass} style={{ background: "var(--accent)" }} />
            {t}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function BenefitsList({ scroll = false }: Props) {
  return (
    <div className={scroll ? "max-h-[38vh] overflow-y-auto pr-1" : ""}>
      <Group
        icon={<Sparkles size={14} strokeWidth={2.2} />}
        heading="INCREASES YOU IN"
        items={BENEFITS_INCREASES}
      />
      <Group
        icon={<Shield size={14} strokeWidth={2.2} />}
        heading="PROTECTS YOU FROM"
        items={BENEFITS_PROTECTS}
      />
    </div>
  );
}
