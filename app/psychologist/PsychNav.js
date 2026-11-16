"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { IGrid, ICard, IEye } from "./icons";

const ITEMS = [
  { href: "/psychologist", label: "Overview", icon: IGrid },
  { href: "/psychologist/profile", label: "Profile & credentials", icon: ICard },
  { href: "/psychologist/profile/preview", label: "Preview as client", icon: IEye },
];

export default function PsychNav() {
  const path = usePathname();
  return (
    <nav className="p-nav" aria-label="Psychologist">
      {ITEMS.map(({ href, label, icon: Icon }) => {
        const on = path === href;
        return (
          <Link key={href} href={href} className={on ? "on" : ""} aria-current={on ? "page" : undefined}>
            <Icon /><span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
