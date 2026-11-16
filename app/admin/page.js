import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";
import { fmtDateTime, timeAgo, describeAudit } from "@/lib/format";
import { Avatar, Empty } from "./ui";
import { TrendChart, Donut } from "./charts";
import ReviewActions from "./verifications/ReviewActions";
import { IUsers, IActivity, IBan, IClock, ISearch, IAlert } from "./icons";

export const metadata = { title: "Overview — Sakoon Admin" };

const DAY = 86400000;
const TZ = "Asia/Karachi";
const ymd = (d) => new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(d); // YYYY-MM-DD
const fmt = (opts, d) => new Intl.DateTimeFormat("en-GB", { timeZone: "UTC", ...opts }).format(d);

function buildBuckets(range) {
  const now = new Date();
  if (range === "12m") {
    const [y, m] = ymd(now).split("-").map(Number);
    return Array.from({ length: 12 }, (_, i) => {
      const d = new Date(Date.UTC(y, m - 1 - (11 - i), 1));
      const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-01`;
      return { key, label: fmt({ month: "short" }, d), full: fmt({ month: "long", year: "numeric" }, d) };
    });
  }
  return Array.from({ length: 30 }, (_, i) => {
    const key = ymd(new Date(now.getTime() - (29 - i) * DAY));
    const d = new Date(`${key}T12:00:00Z`);
    return { key, label: fmt({ day: "numeric", month: "short" }, d), full: fmt({ dateStyle: "medium" }, d) };
  });
}

export default async function Overview({ searchParams }) {
  await requireAdmin();
  const range = (await searchParams).range === "12m" ? "12m" : "30d";
  const unit = range === "12m" ? "month" : "day";
  const periodLabel = range === "12m" ? "last 12 months" : "last 30 days";

  const buckets = buildBuckets(range);
  const since = new Date(`${buckets[0].key}T00:00:00+05:00`);
  const twoDaysAgo = new Date(Date.now() - 2 * DAY);

  // Prisma timestamps are stored as UTC without a timezone; convert to Karachi before bucketing.
  const performanceQuery =
    unit === "month"
      ? prisma.$queryRaw`with revenue as (
                           select to_char(date_trunc('month', (processed_at at time zone 'UTC') at time zone 'Asia/Karachi'), 'YYYY-MM-DD') as key,
                                  sum(case when kind = 'refund' then -amount_pkr else amount_pkr end)::bigint as revenue
                           from consultation_payments
                           where status = 'succeeded' and processed_at >= ${since}
                           group by 1
                         ), completed_consultations as (
                           select to_char(date_trunc('month', (completed_at at time zone 'UTC') at time zone 'Asia/Karachi'), 'YYYY-MM-DD') as key,
                                  count(*)::int as consultations
                           from consultations
                           where status = 'completed' and completed_at >= ${since}
                           group by 1
                         )
                         select coalesce(revenue.key, completed_consultations.key) as key,
                                coalesce(revenue.revenue, 0)::bigint as revenue,
                                coalesce(completed_consultations.consultations, 0)::int as consultations
                         from revenue full outer join completed_consultations using (key)`
      : prisma.$queryRaw`with revenue as (
                           select to_char(date_trunc('day', (processed_at at time zone 'UTC') at time zone 'Asia/Karachi'), 'YYYY-MM-DD') as key,
                                  sum(case when kind = 'refund' then -amount_pkr else amount_pkr end)::bigint as revenue
                           from consultation_payments
                           where status = 'succeeded' and processed_at >= ${since}
                           group by 1
                         ), completed_consultations as (
                           select to_char(date_trunc('day', (completed_at at time zone 'UTC') at time zone 'Asia/Karachi'), 'YYYY-MM-DD') as key,
                                  count(*)::int as consultations
                           from consultations
                           where status = 'completed' and completed_at >= ${since}
                           group by 1
                         )
                         select coalesce(revenue.key, completed_consultations.key) as key,
                                coalesce(revenue.revenue, 0)::bigint as revenue,
                                coalesce(completed_consultations.consultations, 0)::int as consultations
                         from revenue full outer join completed_consultations using (key)`;

  const [performance, newByRole, vGroups, restricted, overdue, queue, activity] = await Promise.all([
    performanceQuery,
    prisma.user.groupBy({ by: ["role"], where: { role: { not: "admin" }, createdAt: { gte: since } }, _count: true }),
    prisma.psychologistProfile.groupBy({ by: ["verificationStatus"], _count: true }),
    prisma.user.count({ where: { status: { not: "active" } } }),
    prisma.psychologistProfile.count({ where: { verificationStatus: "pending", user: { createdAt: { lt: twoDaysAgo } } } }),
    prisma.psychologistProfile.findMany({
      where: { verificationStatus: "pending" },
      orderBy: { user: { createdAt: "asc" } },
      take: 5,
      select: { user: { select: { id: true, fullName: true, email: true, phone: true, createdAt: true } } },
    }),
    prisma.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 6,
      select: { id: true, action: true, metadata: true, createdAt: true, actor: { select: { fullName: true } } },
    }),
  ]);

  const byKey = Object.fromEntries(performance.map((r) => [r.key, r]));
  const points = buckets.map((b) => ({
    ...b,
    revenue: Number(byKey[b.key]?.revenue ?? 0),
    consultations: byKey[b.key]?.consultations ?? 0,
  }));

  const v = Object.fromEntries(vGroups.map((g) => [g.verificationStatus, g._count]));
  const newN = (role) => newByRole.find((r) => r.role === role)?._count ?? 0;
  const totalPsy = Object.values(v).reduce((a, b) => a + b, 0);
  const totalClients = await prisma.user.count({ where: { role: "client" } });
  const pending = v.pending ?? 0;
  const approvedPct = totalPsy ? Math.round(((v.approved ?? 0) / totalPsy) * 100) : 0;

  const alerts = [
    { n: overdue, text: `application${overdue === 1 ? "" : "s"} waiting more than 2 days`, href: "/admin/verifications?status=pending", tone: "bad" },
    { n: v.additional_info_required ?? 0, text: "awaiting a reply from the applicant", href: "/admin/verifications?status=additional_info_required", tone: "warn" },
    { n: restricted, text: `suspended or deactivated account${restricted === 1 ? "" : "s"}`, href: "/admin/users?status=suspended", tone: "warn" },
  ].filter((a) => a.n > 0);

  const tab = (r, text) => (
    <Link href={`/admin?range=${r}`} className={range === r ? "on" : ""} aria-current={range === r ? "true" : undefined}>{text}</Link>
  );

  return (
    <>
      <header className="a-top">
        <div>
          <h1>Platform overview</h1>
          <p><i className="a-live" />Live data · updated {fmtDateTime(new Date())}</p>
        </div>
        <div className="a-tools">
          <form action="/admin/users" className="a-search" role="search">
            <ISearch size={16} />
            <input name="q" placeholder="Search users by name or email" aria-label="Search users" />
          </form>
          <div className="a-seg" role="group" aria-label="Time range">{tab("30d", "30 days")}{tab("12m", "12 months")}</div>
        </div>
      </header>

      <section className="a-kpis">
        <div className="a-kpi">
          <div className="a-kpi-top"><span>Registered clients</span><i><IUsers size={16} /></i></div>
          <strong>{totalClients}</strong>
          <small>+{newN("client")} in the {periodLabel}</small>
        </div>
        <div className="a-kpi">
          <div className="a-kpi-top"><span>Psychologists</span><i><IActivity size={16} /></i></div>
          <strong>{totalPsy}</strong>
          <small>{v.approved ?? 0} verified · +{newN("psychologist")} new</small>
        </div>
        <Link href="/admin/users?status=suspended" className="a-kpi link">
          <div className="a-kpi-top"><span>Restricted accounts</span><i><IBan size={16} /></i></div>
          <strong>{restricted}</strong>
          <small>Suspended or deactivated</small>
        </Link>
        <Link href="/admin/verifications" className="a-kpi dark">
          <div className="a-kpi-top"><span>Awaiting verification</span><i><IClock size={16} /></i></div>
          <strong>{pending}</strong>
          <small>{pending ? "Review the queue →" : "Nothing waiting"}</small>
        </Link>
      </section>

      <section className="a-grid-2">
        <div className="a-panel">
          <div className="a-panel-head"><h2>Revenue &amp; consultations</h2><span className="a-pill">{periodLabel}</span></div>
          <TrendChart points={points} unit={unit} />
          <div className="a-legend"><span><i className="sq" />Revenue</span><span><i className="ln" />Completed consultations</span></div>
        </div>
        <div className="a-panel">
          <div className="a-panel-head"><h2>Psychologist verification</h2></div>
          <Donut centerValue={`${approvedPct}%`} centerLabel="verified" segments={[
            { label: "Approved", value: v.approved ?? 0, color: "#1f7a73" },
            { label: "Pending", value: pending, color: "#e0a83c" },
            { label: "Info requested", value: v.additional_info_required ?? 0, color: "#7c93d6" },
            { label: "Rejected", value: v.rejected ?? 0, color: "#c8503f" },
          ]} />
        </div>
      </section>

      <section className="a-panel a-block">
        <div className="a-panel-head">
          <div><h2>Credential verification queue</h2><p className="a-sub">Only approved psychologists appear in search and can accept paid bookings.</p></div>
          <Link href="/admin/verifications">View all {pending}</Link>
        </div>
        {queue.length === 0 ? <Empty>No applications waiting. You’re all caught up.</Empty> : (
          <div className="a-table-wrap flat">
            <table className="a-table">
              <thead><tr><th>Applicant</th><th>Phone</th><th>Submitted</th><th className="r">Decision</th></tr></thead>
              <tbody>
                {queue.map(({ user }) => (
                  <tr key={user.id}>
                    <td><div className="a-who"><Avatar name={user.fullName} /><div><strong>{user.fullName}</strong><span>{user.email}</span></div></div></td>
                    <td>{user.phone ?? "—"}</td>
                    <td className="nowrap">{timeAgo(user.createdAt)}</td>
                    <td className="r"><ReviewActions compact userId={user.id} name={user.fullName} current="pending" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="a-grid-3">
        <div className="a-panel">
          <div className="a-panel-head"><h2>Recent activity</h2><Link href="/admin/audit">Audit log</Link></div>
          {activity.length === 0 ? <Empty>No admin activity yet.</Empty> : (
            <ul className="a-list">
              {activity.map((l) => (
                <li key={l.id}>
                  <div><strong>{l.actor?.fullName ?? "Deleted admin"}</strong><span>{describeAudit(l)}</span></div>
                  <time>{timeAgo(l.createdAt)}</time>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="a-panel">
          <div className="a-panel-head"><h2>Needs attention</h2></div>
          {alerts.length === 0 ? <Empty>All clear. Nothing is flagged.</Empty> : (
            <ul className="a-alerts">
              {alerts.map((a) => (
                <li key={a.text}>
                  <Link href={a.href}>
                    <i className={a.tone}><IAlert size={16} /></i>
                    <span><b>{a.n}</b> {a.text}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </>
  );
}
