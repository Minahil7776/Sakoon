"use client";
import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { TITLES, SPECIALIZATIONS, LANGUAGES, SESSION_DURATIONS, fmtPKR } from "@/lib/options.mjs";
import { saveBasics, saveAbout, saveSpecializations, addQualification, removeQualification, saveConsultation } from "../actions";
import { ICamera, ITrash } from "../icons";

function useSaver(action) {
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState(null);
  const run = (payload, onOk) =>
    start(async () => {
      setMsg(null);
      const r = await action(payload);
      setMsg(r.ok ? { ok: true } : { error: r.error });
      if (r.ok) onOk?.();
    });
  return { pending, msg, run };
}

const SaveRow = ({ pending, msg, label = "Save changes" }) => (
  <div className="p-save">
    <button className="p-btn solid" disabled={pending}>{pending ? "Saving…" : label}</button>
    {msg?.ok && <span className="p-ok" role="status">Saved</span>}
    {msg?.error && <span className="p-err" role="alert">{msg.error}</span>}
  </div>
);

const Chips = ({ options, selected, onToggle, label }) => (
  <div className="p-chips" role="group" aria-label={label}>
    {options.map((o) => (
      <button type="button" key={o} className={`p-chip ${selected.includes(o) ? "on" : ""}`}
        aria-pressed={selected.includes(o)} onClick={() => onToggle(o)}>{o}</button>
    ))}
  </div>
);

export function PhotoUploader({ name, photoUrl }) {
  const router = useRouter();
  const input = useRef(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function onChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true); setError("");
    const body = new FormData();
    body.append("file", file);
    try {
      const res = await fetch("/api/psychologist/photo", { method: "POST", body });
      const data = await res.json();
      if (!res.ok) setError(data.error ?? "Upload failed."); else router.refresh();
    } catch { setError("Upload failed. Check your connection."); }
    finally { setBusy(false); e.target.value = ""; }
  }

  const initials = name.split(" ").filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase();
  return (
    <div className="p-photo">
      {photoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={photoUrl} alt="Your profile photo" />
      ) : <span aria-hidden="true">{initials}</span>}
      <div>
        <button type="button" className="p-btn" onClick={() => input.current.click()} disabled={busy}>
          <ICamera size={16} /> {busy ? "Uploading…" : photoUrl ? "Change photo" : "Upload photo"}
        </button>
        <p className="p-sub">A clear, friendly headshot. JPG, PNG or WebP, up to 2 MB.</p>
        {error && <p className="p-err" role="alert">{error}</p>}
        <input ref={input} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={onChange} />
      </div>
    </div>
  );
}

export function BasicsForm({ profile }) {
  const [v, setV] = useState({ ...profile, experienceYears: profile.experienceYears ?? "" });
  const { pending, msg, run } = useSaver(saveBasics);
  const toggle = (l) => setV((s) => ({ ...s, languages: s.languages.includes(l) ? s.languages.filter((x) => x !== l) : [...s.languages, l] }));

  return (
    <form className="p-form" onSubmit={(e) => {
      e.preventDefault();
      run({ title: v.title, experienceYears: v.experienceYears === "" ? null : Number(v.experienceYears),
        institution: v.institution, languages: v.languages });
    }}>
      <div className="p-grid">
        <label className="p-field">Professional title
          <select value={v.title} onChange={(e) => setV({ ...v, title: e.target.value })}>
            <option value="">Select…</option>
            {TITLES.map((t) => <option key={t}>{t}</option>)}
          </select>
        </label>
        <label className="p-field">Years of experience
          <input type="number" min="0" max="60" inputMode="numeric" value={v.experienceYears}
            onChange={(e) => setV({ ...v, experienceYears: e.target.value })} />
        </label>
      </div>
      <label className="p-field">Clinic or institution <em>(optional)</em>
        <input value={v.institution} maxLength={120} placeholder="e.g. Aga Khan University Hospital"
          onChange={(e) => setV({ ...v, institution: e.target.value })} />
      </label>
      <div className="p-field">Languages you consult in
        <Chips options={LANGUAGES} selected={v.languages} onToggle={toggle} label="Languages" />
      </div>
      <SaveRow pending={pending} msg={msg} />
    </form>
  );
}

export function AboutForm({ bio: initial }) {
  const [bio, setBio] = useState(initial);
  const { pending, msg, run } = useSaver(saveAbout);
  const n = bio.trim().length;
  const hint = n < 150 ? `${150 - n} more characters to count toward 80%` : n < 400 ? "Good. 400+ characters earns extra strength." : "Great detail.";

  return (
    <form className="p-form" onSubmit={(e) => { e.preventDefault(); run({ bio }); }}>
      <label className="p-field">About
        <textarea rows={7} maxLength={1500} value={bio} onChange={(e) => setBio(e.target.value)}
          placeholder="Who you help, how you work, and what a first session feels like." />
      </label>
      <p className="p-sub p-count">{n}/1500 · {hint}</p>
      <SaveRow pending={pending} msg={msg} />
    </form>
  );
}

export function SpecializationsForm({ names, primary: initialPrimary }) {
  const [sel, setSel] = useState(names);
  const [primary, setPrimary] = useState(initialPrimary);
  const { pending, msg, run } = useSaver(saveSpecializations);

  const toggle = (name) => {
    const next = sel.includes(name) ? sel.filter((s) => s !== name) : sel.length < 6 ? [...sel, name] : sel;
    setSel(next);
    if (!next.includes(primary)) setPrimary(next[0] ?? "");
  };

  return (
    <form className="p-form" onSubmit={(e) => { e.preventDefault(); run({ names: sel, primary }); }}>
      <Chips options={SPECIALIZATIONS} selected={sel} onToggle={toggle} label="Specializations" />
      <p className="p-sub">{sel.length}/6 selected</p>
      {sel.length > 1 && (
        <label className="p-field">Main focus
          <select value={primary} onChange={(e) => setPrimary(e.target.value)}>
            {sel.map((s) => <option key={s}>{s}</option>)}
          </select>
        </label>
      )}
      <SaveRow pending={pending} msg={msg} />
    </form>
  );
}

const TYPES = {
  degree: { label: "Degree", title: "Degree", ph: "e.g. M.Sc Clinical Psychology", inst: "University" },
  license: { label: "Licence", title: "Licence name", ph: "e.g. Professional licence", inst: "Issued by" },
  certification: { label: "Certification", title: "Certification", ph: "e.g. Certified CBT Practitioner", inst: "Awarded by" },
};
const EMPTY = { type: "degree", title: "", institution: "", year: "", reference: "" };

export function QualificationsForm({ items }) {
  const [v, setV] = useState(EMPTY);
  const [removeError, setRemoveError] = useState("");
  const [removing, startRemove] = useTransition();
  const { pending, msg, run } = useSaver(addQualification);
  const t = TYPES[v.type];

  return (
    <>
      {items.length > 0 && (
        <ul className="p-quals">
          {items.map((q) => (
            <li key={q.id}>
              <div>
                <small>{TYPES[q.type].label}</small>
                <strong>{q.title}</strong>
                <span>{q.institution}{q.year ? ` · ${q.year}` : ""}{q.reference ? ` · No. ${q.reference}` : ""}</span>
              </div>
              <button type="button" className="p-ico" aria-label={`Remove ${q.title}`} disabled={removing}
                onClick={() => startRemove(async () => { setRemoveError(""); const r = await removeQualification(q.id); if (!r.ok) setRemoveError(r.error); })}>
                <ITrash size={16} />
              </button>
            </li>
          ))}
        </ul>
      )}
      {removeError && <p className="p-err" role="alert">{removeError}</p>}

      <form className="p-form p-add" onSubmit={(e) => {
        e.preventDefault();
        run({ type: v.type, title: v.title, institution: v.institution,
          year: v.year === "" ? null : Number(v.year), reference: v.reference }, () => setV({ ...EMPTY, type: v.type }));
      }}>
        <h3>Add another</h3>
        <div className="p-grid">
          <label className="p-field">Type
            <select value={v.type} onChange={(e) => setV({ ...EMPTY, type: e.target.value })}>
              {Object.entries(TYPES).map(([k, x]) => <option key={k} value={k}>{x.label}</option>)}
            </select>
          </label>
          <label className="p-field">{t.title}
            <input value={v.title} placeholder={t.ph} maxLength={120} onChange={(e) => setV({ ...v, title: e.target.value })} />
          </label>
          <label className="p-field">{t.inst}
            <input value={v.institution} maxLength={120} onChange={(e) => setV({ ...v, institution: e.target.value })} />
          </label>
          {v.type === "license" ? (
            <label className="p-field">Licence number
              <input value={v.reference} maxLength={60} onChange={(e) => setV({ ...v, reference: e.target.value })} />
            </label>
          ) : (
            <label className="p-field">Year <em>(optional)</em>
              <input type="number" inputMode="numeric" min="1950" max={new Date().getFullYear()} value={v.year}
                onChange={(e) => setV({ ...v, year: e.target.value })} />
            </label>
          )}
        </div>
        <SaveRow pending={pending} msg={msg} label="Add" />
      </form>
    </>
  );
}

export function ConsultationForm({ fee: f, duration: d }) {
  const [fee, setFee] = useState(f ?? "");
  const [duration, setDuration] = useState(d ?? 0);
  const { pending, msg, run } = useSaver(saveConsultation);

  return (
    <form className="p-form" onSubmit={(e) => { e.preventDefault(); run({ fee: fee === "" ? null : Number(fee), duration }); }}>
      <label className="p-field">Fee per session (PKR)
        <input type="number" inputMode="numeric" min="500" max="100000" step="50" value={fee}
          onChange={(e) => setFee(e.target.value)} />
      </label>
      <div className="p-field">Session length
        <div className="p-chips" role="radiogroup" aria-label="Session length">
          {SESSION_DURATIONS.map((m) => (
            <button type="button" key={m} role="radio" aria-checked={duration === m}
              className={`p-chip ${duration === m ? "on" : ""}`} onClick={() => setDuration(m)}>{m} min</button>
          ))}
        </div>
      </div>
      {fee && duration ? <p className="p-sub">Clients will see {fmtPKR(fee)} for a {duration}-minute session.</p> : null}
      <SaveRow pending={pending} msg={msg} />
    </form>
  );
}
