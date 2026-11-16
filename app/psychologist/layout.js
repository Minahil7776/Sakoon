import "./psychologist.css";
import Link from "next/link";
import { requirePsychologist } from "@/lib/psychologist";
import { getOwnProfile } from "@/lib/profile";
import PsychNav from "./PsychNav";
import { Avatar, STATUS } from "./ui";
import { ILogout } from "./icons";

export const metadata = { title: "Psychologist — Sakoon", robots: { index: false, follow: false } };

export default async function PsychologistLayout({ children }) {
  const user = await requirePsychologist();
  const profile = await getOwnProfile(user.id);
  const st = STATUS[profile.verificationStatus];
  const license = profile.qualifications.find((q) => q.type === "license");

  return (
    <div className="p-shell">
      <aside className="p-side">
        <Link href="/psychologist" className="p-brand">
          <svg width="26" height="26" viewBox="0 0 28 28" aria-hidden="true">
            <circle cx="14" cy="14" r="13" fill="none" stroke="currentColor" strokeWidth="1.6" />
            <path d="M14 7v14M7 14h14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
          Sakoon
        </Link>

        <div className="p-me">
          <Avatar name={user.fullName} url={profile.photoUrl} />
          <div><strong>{user.fullName}</strong><span>{profile.title ?? "Psychologist"}</span></div>
        </div>

        <PsychNav />

        <div className={`p-verify ${st.tone}`}>
          <strong>{st.title}</strong>
          {license?.reference && <span>Lic. {license.reference}</span>}
          <form action="/api/auth/logout" method="post">
            <button className="p-link"><ILogout size={15} /> Sign out</button>
          </form>
        </div>
      </aside>
      <main className="p-main">{children}</main>
    </div>
  );
}
