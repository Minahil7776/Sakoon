import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";
import { fmtDate } from "@/lib/format";
import { Badge, Empty, Pagination } from "../ui";
import UserActions from "./UserActions";

export const metadata = { title: "Users — Sakoon Admin" };
const PAGE_SIZE = 15;

export default async function UsersPage({ searchParams }) {
  const admin = await requireAdmin();
  const sp = await searchParams;

  const q = (sp.q ?? "").trim().slice(0, 80);
  const role = ["client", "psychologist", "admin"].includes(sp.role) ? sp.role : "";
  const status = ["active", "suspended", "deactivated"].includes(sp.status) ? sp.status : "";
  const page = Math.max(1, parseInt(sp.page) || 1);

  const where = {
    ...(role && { role }),
    ...(status && { status }),
    ...(q && { OR: [
      { fullName: { contains: q, mode: "insensitive" } },
      { email: { contains: q, mode: "insensitive" } },
      { phone: { contains: q } },
    ] }),
  };

  const [total, users] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where, orderBy: { createdAt: "desc" }, skip: (page - 1) * PAGE_SIZE, take: PAGE_SIZE,
      select: {
        id: true, fullName: true, email: true, phone: true, role: true, status: true, createdAt: true,
        psychologistProfile: { select: { verificationStatus: true } },
      },
    }),
  ]);

  return (
    <>
      <header className="a-head"><h1>Users</h1><p>Search, review and manage every account on the platform.</p></header>

      <form className="a-filters" method="get">
        <input name="q" defaultValue={q} placeholder="Search name, email or phone" aria-label="Search users" />
        <select name="role" defaultValue={role} aria-label="Role">
          <option value="">All roles</option><option value="client">Clients</option>
          <option value="psychologist">Psychologists</option><option value="admin">Admins</option>
        </select>
        <select name="status" defaultValue={status} aria-label="Status">
          <option value="">Any status</option><option value="active">Active</option>
          <option value="suspended">Suspended</option><option value="deactivated">Deactivated</option>
        </select>
        <button className="a-btn solid primary">Apply</button>
      </form>

      {users.length === 0 ? <Empty>No users match these filters.</Empty> : (
        <div className="a-table-wrap">
          <table className="a-table">
            <thead><tr><th>User</th><th>Role</th><th>Status</th><th>Joined</th><th aria-label="Actions" /></tr></thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td><strong>{u.fullName}</strong><span>{u.email}{u.phone ? ` · ${u.phone}` : ""}</span></td>
                  <td>
                    <Badge value={u.role} />
                    {u.psychologistProfile && <Badge value={u.psychologistProfile.verificationStatus} />}
                  </td>
                  <td><Badge value={u.status} /></td>
                  <td>{fmtDate(u.createdAt)}</td>
                  <td>
                    {u.role !== "admin" && u.id !== admin.id &&
                      <UserActions userId={u.id} name={u.fullName} status={u.status} />}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Pagination page={page} total={total} pageSize={PAGE_SIZE} path="/admin/users" params={{ q, role, status }} />
    </>
  );
}
