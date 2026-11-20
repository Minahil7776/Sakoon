import Link from "next/link";
import { requirePsychologist } from "@/lib/psychologist";
import { getOwnProfile, computeCompleteness, BOOKABLE_THRESHOLD } from "@/lib/profile";
import { Ring, SECTION_HREF } from "../ui";
import { PhotoUploader, BasicsForm, WorkExperienceForm, AboutForm, SpecializationsForm, QualificationsForm, ConsultationForm } from "./forms";

export const metadata = { title: "Profile & credentials — Sakoon" };

const Section = ({ id, title, sub, children }) => (
  <section id={id} className="p-panel p-section">
    <div className="p-panel-head"><div><h2>{title}</h2><p className="p-sub">{sub}</p></div></div>
    {children}
  </section>
);

export default async function ProfilePage() {
  const user = await requirePsychologist();
  const profile = await getOwnProfile(user.id);
  const c = computeCompleteness(profile);
  const left = Math.max(0, BOOKABLE_THRESHOLD - c.percent);

  return (
    <>
      <header className="p-top">
        <div><h1>Profile &amp; credentials</h1><p>This is what clients see before they book. Each section saves on its own.</p></div>
        <Link href="/psychologist/profile/preview" className="p-btn">Preview as client</Link>
      </header>

      <div className="p-editor">
        <div className="p-stack">
          <Section id="basic" title="Basics" sub="Your photo, title and how clients can reach you in their language.">
            <PhotoUploader name={user.fullName} photoUrl={profile.photoUrl} />
            <BasicsForm profile={{
              title: profile.title ?? "",
              institution: profile.institution ?? "", languages: profile.languages,
            }} />
          </Section>

          <Section id="experience" title="Work experience" sub="Add job titles, organizations and dates to show clients your professional background.">
            <WorkExperienceForm items={profile.workExperiences.map((item) => ({
              id: item.id, title: item.title, organization: item.organization, location: item.location ?? "",
              startDate: item.startDate.toISOString().slice(0, 7),
              endDate: item.endDate?.toISOString().slice(0, 7) ?? "",
              current: item.current, description: item.description ?? "", documentPath: item.documentPath,
              hasDocument: !!item.documentPath,
            }))} />
          </Section>

          <Section id="about" title="About you" sub="Describe your approach in your own words. Clients read this first.">
            <AboutForm bio={profile.bio ?? ""} />
          </Section>

          <Section id="specializations" title="Specializations" sub="Pick up to 6. Clients can filter by these.">
            <SpecializationsForm
              names={profile.specializations.map((s) => s.specialization.name)}
              primary={profile.specializations.find((s) => s.isPrimary)?.specialization.name ?? ""} />
          </Section>

          <Section id="credentials" title="Qualifications & credentials" sub="Education and your licence are needed to go live. Certifications are optional.">
            <QualificationsForm items={profile.qualifications.map((q) => ({
              id: q.id, type: q.type, title: q.title, institution: q.institution, year: q.year, reference: q.reference,
            }))} />
          </Section>

          <Section id="consultation" title="Consultation" sub="Your fee per session and how long each session lasts.">
            <ConsultationForm fee={profile.consultationFee} duration={profile.sessionDuration} />
          </Section>
        </div>

        <aside className="p-aside">
          <div className="p-panel p-strength">
            <Ring percent={c.percent} />
            <h2>{c.percent >= 100 ? "Profile complete" : c.meetsThreshold ? "Ready to go live" : "Profile strength"}</h2>
            <p className="p-sub">
              {c.meetsThreshold
                ? "You’ve met the minimum. Add the extras to stand out."
                : `${left}% more to reach ${BOOKABLE_THRESHOLD}% and appear in search.`}
            </p>
            {c.missingEssential.length > 0 && (
              <ul className="p-todo">
                {c.missingEssential.map((i) => (
                  <li key={i.key}><Link href={SECTION_HREF(i.section)}>{i.label}</Link><b>+{i.points}%</b></li>
                ))}
              </ul>
            )}
          </div>
        </aside>
      </div>
    </>
  );
}
