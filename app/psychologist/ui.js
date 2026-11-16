export const STATUS = {
  pending: { tone: "warn", short: "Pending", title: "Verification in progress", text: "Our team is reviewing your credentials." },
  approved: { tone: "ok", short: "Verified", title: "Verified psychologist", text: "Your credentials are verified." },
  additional_info_required: { tone: "info", short: "Info needed", title: "More information needed", text: "Our team asked for more details. Read the message, update your profile and resubmit." },
  rejected: { tone: "bad", short: "Not approved", title: "Application not approved", text: "Read the reason, update your profile and resubmit." },
};

export const SECTION_HREF = (s) => `/psychologist/profile#${s}`;

export const Avatar = ({ name, url, size = 44 }) =>
  url ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={url} alt="" className="p-avatar" style={{ width: size, height: size }} />
  ) : (
    <span className="p-avatar" style={{ width: size, height: size }} aria-hidden="true">
      {name.split(" ").filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase()}
    </span>
  );

export function Ring({ percent, size = 120 }) {
  const r = 46, c = 2 * Math.PI * r;
  return (
    <svg width={size} height={size} viewBox="0 0 110 110" role="img" aria-label={`Profile strength ${percent}%`}>
      <circle cx="55" cy="55" r={r} fill="none" stroke="#e3ede9" strokeWidth="10" />
      <circle cx="55" cy="55" r={r} fill="none" stroke={percent >= 80 ? "#1f7a73" : "#e0a83c"} strokeWidth="10"
        strokeLinecap="round" strokeDasharray={`${(percent / 100) * c} ${c}`} transform="rotate(-90 55 55)" />
      <text x="55" y="61" textAnchor="middle" className="ring-t">{percent}%</text>
    </svg>
  );
}

/** Progress bar with a tick at the 80% "go live" mark. */
export const Meter = ({ percent }) => (
  <div className="p-meter" role="progressbar" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100}>
    <span style={{ width: `${percent}%` }} />
    <i title="80% to go live" />
  </div>
);
