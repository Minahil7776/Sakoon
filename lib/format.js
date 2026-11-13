const TZ = "Asia/Karachi";

export const fmtDate = (d) =>
  new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeZone: TZ }).format(new Date(d));

export const fmtDateTime = (d) =>
  new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: TZ }).format(new Date(d));

export const label = (s) => s.replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase());

export function describeAudit(log) {
  const m = log.metadata ?? {};
  switch (log.action) {
    case "user.status_changed":
      return `Changed ${m.email ?? "a user"} from ${m.from} to ${m.to}${m.reason ? ` — “${m.reason}”` : ""}`;
    case "psychologist.reviewed":
      return `Set ${m.name ?? m.email ?? "a psychologist"} to ${label(m.decision).toLowerCase()}${m.note ? ` — “${m.note}”` : ""}`;
    default:
      return log.action;
  }
}

export function timeAgo(d) {
  const s = Math.floor((Date.now() - new Date(d).getTime()) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  if (s < 7 * 86400) return `${Math.floor(s / 86400)}d ago`;
  return fmtDate(d);
}
