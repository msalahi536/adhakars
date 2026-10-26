// iOS keeps at most 64 pending local notifications per app and silently drops the rest.
// Every scheduler plans only a few days ahead; this budget is the app-wide safety net.

export const IOS_PENDING_LIMIT = 64;
/** Headroom under the hard limit for one-off schedules made between app opens. */
export const NOTIFICATION_BUDGET = 60;

/** Most pending notifications each source can hold at once (worst case, everything turned on). */
export const SOURCE_MAX = {
  adhan: 10, // 5 prayers, today + tomorrow
  smartAdhkar: 12, // 4 kinds × 3 days
  sunnah: 1,
  jumuah: 1, // repeating weekly
  streak: 2,
  fasting: 4,
  hifz: 3, // daily reminder × 3 days
  period: 20,
  fertility: 12,
} as const;
/** Per user-made reminder (morning, evening and custom), days planned ahead. */
export const REMINDER_DAYS_AHEAD = 3;

export type PendingNote = { id: number; at: number | null; critical?: boolean };

/**
 * Ids to cancel so the total fits the budget. Prayer alerts (critical) are never cut;
 * otherwise the furthest-away notifications go first, since the next app open re-plans them.
 * Repeating notifications (no fixed time) are kept with the critical ones.
 */
export function trimToBudget(pending: PendingNote[], limit = NOTIFICATION_BUDGET): number[] {
  if (pending.length <= limit) return [];
  const cuttable = pending.filter((p) => !p.critical && p.at !== null).sort((a, b) => (b.at as number) - (a.at as number));
  return cuttable.slice(0, pending.length - limit).map((p) => p.id);
}

/** Read the device's pending list and cancel the overflow. Safe to call after any scheduling. */
export async function enforceNotificationBudget(plugin: any, isCritical: (id: number) => boolean): Promise<number> {
  if (!plugin?.getPending) return 0;
  try {
    const res = await plugin.getPending();
    const list: PendingNote[] = (res?.notifications ?? []).map((n: { id: number; schedule?: { at?: string | Date } }) => {
      const at = n.schedule?.at ? new Date(n.schedule.at).getTime() : null;
      return { id: n.id, at: Number.isFinite(at) ? at : null, critical: isCritical(n.id) };
    });
    const cut = trimToBudget(list);
    if (cut.length) await plugin.cancel({ notifications: cut.map((id) => ({ id })) });
    return cut.length;
  } catch {
    return 0;
  }
}
