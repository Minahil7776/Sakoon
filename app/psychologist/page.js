import Link from "next/link";
import { requirePsychologist } from "@/lib/psychologist";
import { getOwnProfile, computeCompleteness, visibilityOf, BOOKABLE_THRESHOLD } from "@/lib/profile";
import { InstantToggle, ResubmitButton } from "./controls";
import { Meter, STATUS, SECTION_HREF } from "./ui";
import { ICheck, IArrow } from "./icons";

export const metadata = { title: "Overview — Sakoon" };
const TZ = "Asia/Karachi";

export default async function Overview() {
  const user = await requirePsychologist();
  const profile = await getOwnProfile(user.id);
  const c = computeCompleteness(profile);
  const vis = visibilityOf(profile, c.percent);
  const st = STATUS[profile.verificationStatus];
  const next = c.missingEssential[0] ?? c.missingOptional[0];
  const needsReview = ["rejected", "additional_info_required"].includes(profile.verificationStatus);

  const hour = Number(new Intl.DateTimeFormat("en-GB", { hour: "numeric", hour12: false, timeZone: TZ }).format(new Date()));
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const today = new Intl.DateTimeFormat("en-GB", { dateStyle: "full", timeZone: TZ }).format(new Date());
  const groups = [
    ["Essentials — needed to go live", c.items.filter((i) => i.essential)],
    ["Extras — help you stand out", c.items.filter((i) => !i.essential)],
  ];

  return (
    <>
      <header className="p-top">
        <div>
          <h1>{greeting}, {user.fullName.split(" ")[0]}</h1>
          <p>{today} · PKT (GMT+5)</p>
        </div>
        <InstantToggle enabled={profile.acceptsInstant} />
      </header>

      <section className="p-kpis">
        <div className="p-kpi">
          <span>Profile strength</span>
          <strong>{c.percent}%</strong>
          <small>{c.missingEssential.length ? `${c.missingEssential.length} essential item${c.missingEssential.length === 1 ? "" : "s"} left` : "All essentials done"}</small>
        </div>
        <div className="p-kpi">
          <span>Verification</span>
          <strong className="sm"><i className={`dot ${st.tone}`} />{st.short}</strong>
          <small>{profile.verificationStatus === "approved" ? "Credentials verified" : "Reviewed by our team"}</small>
        </div>
        <div className="p-kpi">
          <span>Visible to clients</span>
          <strong className="sm"><i className={`dot ${vis.visible ? "ok" : "warn"}`} />{vis.visible ? "Live" : "Hidden"}</strong>
          <small>{vis.reason}</small>
        </div>
        <Link href={next ? SECTION_HREF(next.section) : "/psychologist/profile/preview"} className="p-kpi dark">
          <span>{c.missingEssential.length ? "Next step" : next ? "Make it stand out" : "Profile complete"}</span>
          <strong className="sm">{next ? next.label : "See how clients view you"}</strong>
          <small>{next ? `+${next.points}% →` : "Preview →"}</small>
        </Link>
      </section>

      <div className="p-cols">
        <section className="p-panel">
          <div className="p-panel-head">
            <div><h2>Profile checklist</h2><p className="p-sub">Reach {BOOKABLE_THRESHOLD}% and get verified to appear in search. 100% means a complete profile.</p></div>
            <Link href="/psychologist/profile" className="p-btn">Edit profile</Link>
          </div>
          <Meter percent={c.percent} />
          {groups.map(([title, items]) => (
            <div key={title} className="p-group">
              <h3>{title}</h3>
              <ul className="p-check" >
                {items.map((i) => (
                  <li key={i.key} className={i.done ? "done" : ""}>
                    <i aria-hidden="true">{i.done && <ICheck size={13} />}</i>
                    {i.done ? <span>{i.label}</span> : <Link href={SECTION_HREF(i.section)}>{i.label}</Link>}
                    <b>+{i.points}%</b>
                  </li>
                  
                ))}
              </ul>
            </div>
          ))}
        </section>

        <div className="p-stack">
          <section className="p-panel">
            <div className="p-panel-head"><h2>Needs your attention</h2></div>
            {needsReview ? (
              <div className={`p-note ${st.tone}`}>
                <strong>{st.title}</strong>
                <p>{profile.reviewNote ?? st.text}</p>
                <ResubmitButton />
              </div>
            ) : profile.verificationStatus === "pending" ? (
              <div className="p-note warn"><strong>{st.title}</strong><p>{st.text} We’ll let you know when it’s done.</p></div>
            ) : null}
            {c.missingEssential.length > 0 && (
              <div className="p-note">
                <strong>{c.missingEssential.length} essential item{c.missingEssential.length === 1 ? "" : "s"} left</strong>
                <p>Finish these to reach {BOOKABLE_THRESHOLD}%.</p>
                <Link href="/psychologist/profile" className="p-btn">Continue profile <IArrow size={15} /></Link>
              </div>
            )}
            {!needsReview && profile.verificationStatus === "approved" && !c.missingEssential.length && (
              <p className="p-empty">You’re live. Nothing needs your attention.</p>
            )}
          </section>

          <section className="p-panel">
            <div className="p-panel-head"><h2>How clients see you</h2></div>
            <p className="p-sub">Preview your public profile exactly as a client would.</p>
            <Link href="/psychologist/profile/preview" className="p-btn">Open preview <IArrow size={15} /></Link>
          </section>
        </div>
      </div>
    </>
  );
}
