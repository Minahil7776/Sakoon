import "./admin.css";
import Link from "next/link";
import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import AdminNav from "./AdminNav";
import { Avatar } from "./ui";
import { ILogout } from "./icons";

export const metadata = { title: "Admin — Sakoon", robots: { index: false, follow: false } };

export default async function AdminLayout({ children }) {
  const admin = await requireAdmin();
  const pending = await prisma.psychologistProfile.count({ where: { verificationStatus: "pending" } });

  return (
    <div className="a-shell">
      <aside className="a-side">
        <Link href="/admin" className="a-brand">
          <svg width="26" height="26" viewBox="0 0 28 28" aria-hidden="true">
            <circle cx="14" cy="14" r="13" fill="none" stroke="currentColor" strokeWidth="1.6" />
            <path d="M14 7v14M7 14h14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
          Sakoon <small>Admin</small>
        </Link>
        <AdminNav pending={pending} />
        <div className="a-me">
          <Avatar name={admin.fullName} />
          <div><strong>{admin.fullName}</strong><span>Administrator</span></div>
          <form action="/api/auth/logout" method="post">
            <button className="a-ico-btn" aria-label="Sign out" title="Sign out"><ILogout /></button>
          </form>
        </div>
      </aside>
      <main className="a-main">{children}</main>
    </div>
  );
}
