import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";
import { fmtDateTime, describeAudit } from "@/lib/format";
import { Empty, Pagination } from "../ui";

export const metadata = { title: "Audit log — Sakoon Admin" };
const PAGE_SIZE = 20;

export default async function AuditPage({ searchParams }) {
  await requireAdmin();
  const page = Math.max(1, parseInt((await searchParams).page) || 1);

  const [total, logs] = await Promise.all([
    prisma.auditLog.count(),
    prisma.auditLog.findMany({
      orderBy: { createdAt: "desc" }, skip: (page - 1) * PAGE_SIZE, take: PAGE_SIZE,
      select: { id: true, action: true, metadata: true, createdAt: true, actor: { select: { fullName: true, email: true } } },
    }),
  ]);

  return (
    <>
      <header className="a-head"><h1>Audit log</h1><p>A permanent record of administrative actions.</p></header>
      {logs.length === 0 ? <Empty>No recorded actions yet.</Empty> : (
        <div className="a-table-wrap">
          <table className="a-table">
            <thead><tr><th>When</th><th>Admin</th><th>Action</th></tr></thead>
            <tbody>
              {logs.map((l) => (
                <tr key={l.id}>
                  <td className="nowrap">{fmtDateTime(l.createdAt)}</td>
                  <td><strong>{l.actor?.fullName ?? "Deleted admin"}</strong><span>{l.actor?.email}</span></td>
                  <td>{describeAudit(l)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Pagination page={page} total={total} pageSize={PAGE_SIZE} path="/admin/audit" />
    </>
  );
}
