import "./public-profile.css";
import { fmtPKR } from "@/lib/profile";

const TYPE = { degree: "Education", license: "Licence", certification: "Certification" };
const initials = (n) => n.split(" ").filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase();

/**
 * One component for both the psychologist's preview and the client-facing page.
 * `profile` comes from loadProfile() / getPublicProfile() in lib/profile.js.
 * Pass `cta` to replace the disabled button with a real booking link on the client side.
 */
export default function PublicProfile({ profile, preview = false, cta }) {
  const name = profile.user.fullName;
  const degree = profile.qualifications.find((q) => q.type === "degree");
  const verified = profile.verificationStatus === "approved";

  return (
    <div className="pp">
      <div className="pp-main">
        <section className="pp-card pp-head">
          {profile.photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={profile.photoUrl} alt={name} className="pp-photo" />
          ) : (
            <span className="pp-photo ph" aria-hidden="true">{initials(name)}</span>
          )}
          <div className="pp-id">
            <h1>{name}{verified && <span className="pp-verified">Verified by Sakoon</span>}</h1>
            <p>{profile.title ?? "Psychologist"}{degree ? ` · ${degree.title}, ${degree.institution}` : ""}</p>
          </div>
          <dl className="pp-stats">
            <div><dt>Rating</dt><dd>New</dd></div>
            <div><dt>Experience</dt><dd>{profile.experienceYears != null ? `${profile.experienceYears} yrs` : "—"}</dd></div>
            <div><dt>Languages</dt><dd>{profile.languages.join(", ") || "—"}</dd></div>
          </dl>
        </section>

        <section className="pp-card">
          <h2>About</h2>
          {profile.bio ? <p className="pp-bio">{profile.bio}</p> : <p className="pp-muted">Not written yet.</p>}
          {profile.specializations.length > 0 && (
            <>
              <h3>Specializations</h3>
              <div className="pp-tags">
                {profile.specializations.map((s) => (
                  <span key={s.specialization.id} className={s.isPrimary ? "main" : ""}>{s.specialization.name}</span>
                ))}
              </div>
            </>
          )}
        </section>

        <section className="pp-card">
          <h2>Qualifications &amp; credentials</h2>
          {profile.qualifications.length === 0 ? <p className="pp-muted">None added yet.</p> : (
            <div className="pp-quals">
              {profile.qualifications.map((q) => (
                <div key={q.id}>
                  <small>{TYPE[q.type]}</small>
                  <strong>{q.title}</strong>
                  <span>{q.institution}{q.year ? ` · ${q.year}` : ""}</span>
                  {q.reference && <span>No. {q.reference}</span>}
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="pp-card">
          <h2>Client reviews</h2>
          <p className="pp-muted">No reviews yet. Reviews appear after completed consultations.</p>
        </section>
      </div>

      <aside className="pp-side">
        <section className="pp-card">
          <h2>Book a session</h2>
          <dl className="pp-rows">
            <div><dt>Session length</dt><dd>{profile.sessionDuration ? `${profile.sessionDuration} minutes` : "—"}</dd></div>
            <div><dt>Consultation fee</dt><dd>{profile.consultationFee ? fmtPKR(profile.consultationFee) : "—"}</dd></div>
            {profile.acceptsInstant && <div><dt>Instant calls</dt><dd>Available now</dd></div>}
          </dl>
          {cta ?? <button className="pp-cta" disabled>{preview ? "Booking opens for clients" : "Continue"}</button>}
        </section>
      </aside>
    </div>
  );
}
