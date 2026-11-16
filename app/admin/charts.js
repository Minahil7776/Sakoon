const niceStep = (x) => {
  const p = 10 ** Math.floor(Math.log10(x));
  const n = x / p;
  return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * p;
};

function formatRupees(value) {
  const sign = value < 0 ? "-" : "";
  const absolute = Math.abs(value);
  if (absolute >= 1_000_000) return `${sign}Rs ${(absolute / 1_000_000).toLocaleString("en-PK", { maximumFractionDigits: 1 })}M`;
  if (absolute >= 1_000) return `${sign}Rs ${(absolute / 1_000).toLocaleString("en-PK", { maximumFractionDigits: 1 })}k`;
  return `${sign}Rs ${absolute}`;
}

/** Bars: collected revenue (left axis). Line: completed consultations (right axis). */
export function TrendChart({ points, unit }) {
  const W = 640, H = 250, L = 50, R = 44, T = 14, B = 30;
  const iw = W - L - R, ih = H - T - B;

  const minRevenue = Math.min(...points.map((p) => p.revenue), 0);
  const maxRevenue = Math.max(...points.map((p) => p.revenue), 0);
  const revenueStep = Math.max(1, niceStep(Math.max(maxRevenue - minRevenue, 1) / 4));
  const minAxisRevenue = Math.floor(minRevenue / revenueStep) * revenueStep;
  let maxAxisRevenue = Math.ceil(maxRevenue / revenueStep) * revenueStep;
  if (maxAxisRevenue === minAxisRevenue) maxAxisRevenue = minAxisRevenue + revenueStep * 4;
  const revenueRange = maxAxisRevenue - minAxisRevenue;
  const consultationStep = Math.max(1, niceStep(Math.max(...points.map((p) => p.consultations), 1) / 4));
  const maxConsultations = consultationStep * 4;

  const slot = iw / points.length;
  const bw = Math.min(22, slot * 0.62);
  const x = (i) => L + slot * i + slot / 2;
  const yRevenue = (v) => T + ih - ((v - minAxisRevenue) / revenueRange) * ih;
  const yConsultations = (v) => T + ih - (v / maxConsultations) * ih;
  const every = points.length > 12 ? 5 : 1;

  return (
    <svg className="a-chart" viewBox={`0 0 ${W} ${H}`} role="img"
      aria-label={`Revenue in Pakistani rupees and completed consultations per ${unit}.`}>
      {[0, 1, 2, 3, 4].map((g) => {
        const y = T + ih - (g / 4) * ih;
        return (
          <g key={g}>
            <line x1={L} x2={W - R} y1={y} y2={y} className="grid" />
            <text x={L - 8} y={y + 4} textAnchor="end" className="ax">
              {formatRupees(minAxisRevenue + (revenueRange * g) / 4)}
            </text>
            <text x={W - R + 8} y={y + 4} className="ax">{consultationStep * g}</text>
          </g>
        );
      })}

      {points.map((p, i) => (
        <g key={p.key}>
          {p.revenue !== 0 && (
            <rect
              x={x(i) - bw / 2}
              y={Math.min(yRevenue(p.revenue), yRevenue(0))}
              width={bw}
              height={Math.abs(yRevenue(p.revenue) - yRevenue(0))}
              rx="4"
              className={i === points.length - 1 ? "bar last" : "bar"}>
              <title>{`${p.full}: ${formatRupees(p.revenue)} revenue`}</title>
            </rect>
          )}
          {(i % every === 0 || i === points.length - 1) && (
            <text x={x(i)} y={H - 8} textAnchor="middle" className="ax">{p.label}</text>
          )}
        </g>
      ))}

      <polyline className="line" fill="none"
        points={points.map((p, i) => `${x(i)},${yConsultations(p.consultations)}`).join(" ")} />
      {points.map((p, i) => (
        <circle key={p.key} cx={x(i)} cy={yConsultations(p.consultations)} r="3" className="dot">
          <title>{`${p.full}: ${p.consultations} completed consultation${p.consultations === 1 ? "" : "s"}`}</title>
        </circle>
      ))}
    </svg>
  );
};

export function Donut({ segments, centerValue, centerLabel }) {
  const total = segments.reduce((s, x) => s + x.value, 0);
  const r = 52, c = 2 * Math.PI * r;
  let acc = 0;
  return (
    <div className="a-donut">
      <svg viewBox="0 0 140 140" role="img"
        aria-label={segments.map((s) => `${s.label}: ${s.value}`).join(", ")}>
        <circle cx="70" cy="70" r={r} fill="none" stroke="#e6efed" strokeWidth="16" />
        {total > 0 && segments.map((s) => {
          const len = (s.value / total) * c;
          const el = s.value > 0 && (
            <circle key={s.label} cx="70" cy="70" r={r} fill="none" stroke={s.color} strokeWidth="16"
              strokeDasharray={`${len} ${c - len}`} strokeDashoffset={-acc} transform="rotate(-90 70 70)" />
          );
          acc += len;
          return el;
        })}
        <text x="70" y="70" textAnchor="middle" className="d-val">{centerValue}</text>
        <text x="70" y="88" textAnchor="middle" className="d-lbl">{centerLabel}</text>
      </svg>
      <ul>
        {segments.map((s) => (
          <li key={s.label}><i style={{ background: s.color }} />{s.label}<b>{s.value}</b></li>
        ))}
      </ul>
    </div>
  );
}
