import Link from "next/link";

export default function AuthShell({ children }) {
  return (
    <main className="shell">
      <aside className="panel" aria-hidden="false">
        <Link href="/login" className="brand">
          <svg width="28" height="28" viewBox="0 0 28 28" aria-hidden="true">
            <circle cx="14" cy="14" r="13" fill="none" stroke="currentColor" strokeWidth="1.6" />
            <path d="M14 7v14M7 14h14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
          Sakoon
        </Link>

        <div className="orb-wrap">
          <div className="orb" role="img" aria-label="A slow breathing circle" />
          <p className="orb-hint">Take a slow breath. You’re in the right place.</p>
        </div>

        <p className="panel-line">
          Private sessions with verified psychologists, from wherever you feel safe.
        </p>
      </aside>

      <section className="content">
        <div className="card">{children}</div>
        <p className="emergency">
          Sakoon doesn’t replace emergency care. If you’re in immediate danger, call your local emergency number.
        </p>
      </section>
    </main>
  );
}
