/** Milestone celebration for the Arabic Companion, in the Hifz MilestoneMoment style. */
import { useEffect } from "react";
import { Award } from "lucide-react";
import { Portal } from "@/components/Portal";
import { play } from "@/lib/hifzHaptics";
import type { Milestone } from "@/lib/arabic";
import "./arabic.css";

export function ArabicMilestone({ milestone, done }: { milestone: Milestone; done: () => void }) {
  useEffect(() => { play("milestone"); }, [milestone.id]);
  return (
    <Portal>
      <section className="ab-milestone" role="dialog" aria-modal="true" aria-label="Milestone">
        <div className="ab-milestone-inner">
          <Award size={52} style={{ margin: "0 auto" }} />
          <h2>{milestone.title}</h2>
          <p>{milestone.detail}</p>
          <button className="ab-primary" onClick={done}>Continue</button>
        </div>
      </section>
    </Portal>
  );
}
