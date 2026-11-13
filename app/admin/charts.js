const niceStep = (x) => {
  const p = 10 ** Math.floor(Math.log10(x));
  const n = x / p;
  return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * p;
};

/** Bars: new sign-ups per bucket (left axis). Line: total users over time (right axis). */
export function TrendChart({ points, baseline, unit }) {
  const W = 640, H = 250, L = 36, R = 44, T = 14, B = 30;
  const iw = W - L - R, ih = H - T - B;

  const step = Math.max(1, niceStep(Math.max(...points.map((p) => p.n), 1) / 4));
  const max = step * 4;
  let run = baseline;
  const cum = points.map((p) => (run += p.n));
  const lo = baseline, hi = Math.max(cum.at(-1), lo + 1);

  const slot = iw / points.length;
  const bw = Math.min(22, slot * 0.62);
  const x = (i) => L + slot * i + slot / 2;
  const yBar = (v) => T + ih - (v / max) * ih;
  const yLine = (v) => T + ih * 0.95 - ((v - lo) / (hi - lo)) * ih * 0.85;
  const every = points.length > 12 ? 5 : 1;

  return (
    <svg className="a-chart" viewBox={`0 0 ${W} ${H}`} role="img"
      aria-label={`New sign-ups per ${unit}. Total users grew from ${baseline} to ${cum.at(-1)}.`}>
      {[0, 1, 2, 3, 4].map((g) => {
        const y = yBar(step * g);
        return (
          <g key={g}>
            <line x1={L} x2={W - R} y1={y} y2={y} className="grid" />
            <text x={L - 8} y={y + 4} textAnchor="end" className="ax">{step * g}</text>
          </g>
        );
      })}
      <text x={W - R + 8} y={T + 10} className="ax">{hi}</text>
      <text x={W - R + 8} y={T + ih} className="ax">{lo}</text>

      {points.map((p, i) => (
        <g key={p.key}>
          {p.n > 0 && (
            <rect x={x(i) - bw / 2} y={yBar(p.n)} width={bw} height={T + ih - yBar(p.n)} rx="4"
              className={i === points.length - 1 ? "bar last" : "bar"}>
              <title>{`${p.full}: ${p.n} new sign-up${p.n === 1 ? "" : "s"}`}</title>
            </rect>
          )}
          {(i % every === 0 || i === points.length - 1) && (
            <text x={x(i)} y={H - 8} textAnchor="middle" className="ax">{p.label}</text>
          )}
        </g>
      ))}

      <polyline className="line" fill="none"
        points={points.map((_, i) => `${x(i)},${yLine(cum[i])}`).join(" ")} />
      <circle cx={x(points.length - 1)} cy={yLine(cum.at(-1))} r="4" className="dot" />
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
