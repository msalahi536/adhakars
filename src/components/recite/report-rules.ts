export const REPORT_LIMIT = 50 * 1024 * 1024;
export const reportAllowed = (adult: boolean, consentedAt: string | null) => adult && !!consentedAt;
export const reportPath = (user: string, date: string, id: string) => `${user}/${date}-${id}.zip`;
export const reportNote = (note: string) => note.trim().slice(0, 200);