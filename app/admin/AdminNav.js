"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { IGrid, IShield, IUsers, IClipboard } from "./icons";

const SECTIONS = [
  { title: "Main", items: [
    { href: "/admin", label: "Overview", icon: IGrid, exact: true },
    { href: "/admin/verifications", label: "Verifications", icon: IShield, badge: true },
    { href: "/admin/users", label: "Users", icon: IUsers },
  ] },
  { title: "System", items: [
    { href: "/admin/audit", label: "Audit log", icon: IClipboard },
  ] },
];

export default function AdminNav({ pending }) {
  const path = usePathname();
  return (
    <nav className="a-nav" aria-label="Admin">
      {SECTIONS.map((s) => (
        <div key={s.title} className="a-nav-group">
          <p className="a-nav-title">{s.title}</p>
          {s.items.map(({ href, label, icon: Icon, exact, badge }) => {
            const on = exact ? path === href : path.startsWith(href);
            return (
              <Link key={href} href={href} aria-current={on ? "page" : undefined} className={on ? "on" : ""}>
                <Icon />
                <span>{label}</span>
                {badge && pending > 0 && <span className="a-count">{pending}</span>}
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );
}
