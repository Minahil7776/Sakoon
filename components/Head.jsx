export default function Head() {
  return (
    <svg viewBox="0 0 400 480" role="img" aria-label="Translucent head profile with a softly glowing brain" className="head">
      <defs>
        <linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#fff" stopOpacity=".9"/><stop offset="1" stopColor="#9fb4d6" stopOpacity=".55"/></linearGradient>
        <radialGradient id="b"><stop offset="0" stopColor="#ffe9a8"/><stop offset=".6" stopColor="#f6c76a" stopOpacity=".8"/><stop offset="1" stopColor="#c9b8ee" stopOpacity="0"/></radialGradient>
        <filter id="s"><feGaussianBlur stdDeviation="9"/></filter>
      </defs>
      <path d="M250 20C150 10 70 80 70 180c0 40 14 62 8 88-4 16-18 26-6 36 8 8 24 6 28 16 4 14-8 30 6 40 12 8 40 2 52 12 8 8 4 40 4 88h158c4-60 2-92 22-120 22-30 34-64 34-110C382 110 340 28 250 20Z" fill="url(#g)" stroke="#fff" strokeWidth="2"/>
      <ellipse cx="225" cy="150" rx="105" ry="85" fill="url(#b)" filter="url(#s)"/>
      <g fill="none" stroke="#fff3c9" strokeWidth="3" strokeLinecap="round" opacity=".95">
        <path d="M140 160c10-40 50-60 90-50 40 8 70 40 60 80"/><path d="M165 190c20-20 50-10 70 6s50 8 60-10"/><path d="M180 120c14 14 30 14 40 0"/>
      </g>
    </svg>
  );
}
