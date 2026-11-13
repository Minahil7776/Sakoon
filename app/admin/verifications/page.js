import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";
import { fmtDate, label } from "@/lib/format";
import { Badge, Empty } from "../ui";
import ReviewActions from "./ReviewActions";

export const metadata = { title: "Verifications — Sakoon Admin" };
const TABS = ["pending", "additional_info_required", "approved", "rejected"];

export default async function Verifications({ searchParams }) {
  await requireAdmin();
  const sp = await searchParams;
  const tab = TABS.includes(sp.status) ? sp.status : "pending";

  const [counts, items] = await Promise.all([
    prisma.psychologistProfile.groupBy({ by: ["verificationStatus"], _count: true }),
    prisma.psychologistProfile.findMany({
      where: { verificationStatus: tab },
      orderBy: { user: { createdAt: "asc" } },
      take: 50,
      select: {
        reviewNote: true, reviewedAt: true,
        user: { select: { id: true, fullName: true, email: true, phone: true, createdAt: true, status: true } },
      },
    }),
  ]);
  const n = Object.fromEntries(counts.map((c) => [c.verificationStatus, c._count]));

  return (
    <>
      <header className="a-head"><h1>Verifications</h1><p>Only approved psychologists appear in search and can take paid bookings.</p></header>

      <div className="a-tabs" role="tablist">
        {TABS.map((t) => (
          <Link key={t} href={`/admin/verifications?status=${t}`} role="tab" aria-selected={t === tab} className={t === tab ? "on" : ""}>
            {label(t)} <span>{n[t] ?? 0}</span>
          </Link>
        ))}
      </div>

      {items.length === 0 ? <Empty>No applications in “{label(tab)}”.</Empty> : (
        <div className="a-cards">
          {items.map(({ user, reviewNote, reviewedAt }) => (
            <article key={user.id} className="a-card">
              <div className="a-card-top">
                <div>
                  <h2>{user.fullName}</h2>
                  <p>{user.email}{user.phone ? ` · ${user.phone}` : ""}</p>
                </div>
                <Badge value={tab} />
              </div>
              <dl>
                <div><dt>Applied</dt><dd>{fmtDate(user.createdAt)}</dd></div>
                <div><dt>Account</dt><dd><Badge value={user.status} /></dd></div>
                {reviewedAt && <div><dt>Last reviewed</dt><dd>{fmtDate(reviewedAt)}</dd></div>}
              </dl>
              {reviewNote && <p className="a-quote">Message sent: {reviewNote}</p>}
              <p className="a-hint">Certificates and licence details will be shown here once psychologist document upload is added.</p>
              <ReviewActions userId={user.id} name={user.fullName} current={tab} />
            </article>
          ))}
        </div>
      )}
    </>
  );
}
