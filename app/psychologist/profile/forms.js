"use client";
import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { TITLES, SPECIALIZATIONS, LANGUAGES, SESSION_DURATIONS, fmtPKR } from "@/lib/options.mjs";
import { saveBasics, saveWorkExperiences, saveAbout, saveSpecializations, addQualification, removeQualification, saveConsultation } from "../actions";
import { ICamera, ITrash } from "../icons";

function useSaver(action) {
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState(null);
  const run = (payload, onOk) => {
    setMsg(null);
    start(async () => {
      let result;
      try {
        result = await action(payload);
      } catch (error) {
        console.error("Profile save failed.", error);
        setMsg({ error: "Couldn’t save changes. Please try again." });
        return;
      }
      if (!result?.ok) {
        setMsg({ error: result?.error ?? "Couldn’t save changes. Please try again." });
        return;
      }
      try {
        const followUpError = await onOk?.(result);
        setMsg(followUpError ? { error: followUpError } : { ok: true });
      } catch (error) {
        console.error("Profile save follow-up failed.", error);
        setMsg({ error: "Changes were saved, but a follow-up step failed." });
      }
    });
  };
  return { pending, msg, run, clear: () => setMsg(null) };
}

const SaveRow = ({ pending, msg, label = "Save changes" }) => (
  <div className="p-save">
    <button className="p-btn solid" disabled={pending}>{pending ? "Saving…" : label}</button>
    {msg?.ok && !pending && <span className="p-ok" role="status">Saved</span>}
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

const EMPTY_EXPERIENCE = { title: "", organization: "", location: "", startDate: "", endDate: "", current: false, description: "", hasDocument: false };

function WorkExperienceDocument({ experienceId, documentPath, hasDocument, onChange }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [previewFailed, setPreviewFailed] = useState(false);
  const endpoint = experienceId ? `/api/psychologist/work-experiences/${experienceId}/document` : null;

  useEffect(() => {
    setPreviewFailed(false);
  }, [documentPath]);

  async function upload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    setError("");
    try {
      const body = new FormData();
      body.append("file", file);
      const response = await fetch(endpoint, { method: "POST", body });
      const result = await response.json();
      if (!response.ok) setError(result.error ?? "Upload failed.");
      else onChange(result.path);
    } catch {
      setError("Upload failed. Check your connection.");
    } finally {
      setBusy(false);
      e.target.value = "";
    }
  }

  async function remove() {
    setBusy(true);
    setError("");
    try {
      const response = await fetch(endpoint, { method: "DELETE" });
      const result = await response.json();
      if (!response.ok) setError(result.error ?? "Couldn’t remove the document.");
      else onChange(null);
    } catch {
      setError("Couldn’t remove the document. Check your connection.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="p-document">
      {hasDocument ? (
        <>
          <div className="p-document-preview">
            {previewFailed ? (
              <span>Document preview unavailable</span>
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={endpoint} alt="Preview of uploaded certificate or work-experience document"
                onError={() => setPreviewFailed(true)} />
            )}
          </div>
          <div className="p-document-actions">
            <a href={endpoint} target="_blank" rel="noreferrer">View document</a>
            <button type="button" className="p-btn" onClick={remove} disabled={busy}>
              {busy ? "Removing…" : "Remove document"}
            </button>
          </div>
          <p className="p-sub">Remove this document before uploading a replacement.</p>
        </>
      ) : (
        <>
          <label className="p-field p-document-field">
            <span>Certificate or supporting document <em>(optional, private)</em></span>
            <input type="file" accept="application/pdf,image/jpeg,image/png" disabled={busy || !experienceId} onChange={upload} />
          </label>
          <p className="p-sub">Upload one PDF, JPG or PNG certificate or other work-experience document, up to 10 MB. Only you can access it.</p>
        </>
      )}
      {error && <p className="p-err" role="alert">{error}</p>}
    </div>
  );
}

const monthLabel = (value) => {
  if (!value) return "";
  const [year, month] = value.split("-").map(Number);
  return new Intl.DateTimeFormat("en", { month: "short", year: "numeric", timeZone: "UTC" })
    .format(new Date(Date.UTC(year, month - 1, 1)));
};

export function WorkExperienceForm({ items: initialItems }) {
  const [items, setItems] = useState(initialItems);
  const [draft, setDraft] = useState({ ...EMPTY_EXPERIENCE });
  const [draftFile, setDraftFile] = useState(null);
  const draftFileInput = useRef(null);
  const [editingId, setEditingId] = useState(null);
  const [removeError, setRemoveError] = useState("");
  const [removing, startRemove] = useTransition();
  const { pending, msg, run, clear } = useSaver(saveWorkExperiences);
  const updateDraft = (key, value) => setDraft((current) => ({ ...current, [key]: value }));

  function removeExperience(id) {
    clear();
    startRemove(async () => {
      setRemoveError("");
      const remaining = items.filter((item) => item.id !== id);
      try {
        const result = await saveWorkExperiences({ experiences: remaining });
        if (!result.ok) {
          setRemoveError(result.error);
          return;
        }
        setItems(remaining);
        if (editingId === id) {
          setEditingId(null);
          setDraft({ ...EMPTY_EXPERIENCE });
        }
      } catch (error) {
        console.error("Work experience removal failed.", error);
        setRemoveError("Couldn’t remove this experience. Please try again.");
      }
    });
  }

  return (
    <>
      {items.length > 0 && (
        <ul className="p-quals p-experience-cards">
          {items.map((item) => (
            <li key={item.id}>
              <div className="p-experience-card-main">
                <small>{item.current ? "CURRENT EXPERIENCE" : "PAST EXPERIENCE"}</small>
                <strong>{item.title}</strong>
                <span>{item.organization}{item.location ? ` · ${item.location}` : ""}</span>
                <span>{monthLabel(item.startDate)} – {item.current ? "Present" : monthLabel(item.endDate)}</span>
                {item.description && <p>{item.description}</p>}
                <WorkExperienceDocument experienceId={item.id} documentPath={item.documentPath}
                  hasDocument={item.hasDocument}
                  onChange={(documentPath) => setItems((current) => current.map((entry) =>
                    entry.id === item.id ? { ...entry, documentPath, hasDocument: !!documentPath } : entry))} />
              </div>
              <div className="p-experience-card-actions">
                <button type="button" className="p-btn" disabled={pending || removing}
                  onClick={() => {
                    clear();
                    setDraft({ ...item });
                    setDraftFile(null);
                    if (draftFileInput.current) draftFileInput.current.value = "";
                    setEditingId(item.id);
                  }}>
                  Edit
                </button>
                <button type="button" className="p-ico" aria-label={`Remove ${item.title}`} disabled={pending || removing}
                  onClick={() => removeExperience(item.id)}>
                  <ITrash size={16} />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
      {removeError && <p className="p-err" role="alert">{removeError}</p>}

      {(items.length < 20 || editingId) && (
        <form className="p-form p-add" onSubmit={(e) => {
          e.preventDefault();
          setRemoveError("");
          const experiences = editingId
            ? items.map((item) => item.id === editingId ? { ...draft, id: editingId } : item)
            : [...items, draft];
          const file = editingId ? null : draftFile;
          run({ experiences }, async (result) => {
            const saved = experiences.map((item, index) => ({ ...item, id: result.ids[index] }));
            setDraft({ ...EMPTY_EXPERIENCE });
            setDraftFile(null);
            if (draftFileInput.current) draftFileInput.current.value = "";
            setEditingId(null);
            let followUpError = "";
            if (file) {
              const newExperience = saved[saved.length - 1];
              try {
                const body = new FormData();
                body.append("file", file);
                const response = await fetch(
                  `/api/psychologist/work-experiences/${newExperience.id}/document`,
                  { method: "POST", body }
                );
                const uploadResult = await response.json();
                if (!response.ok || !uploadResult.path) {
                  followUpError = `Experience saved, but the document upload failed: ${uploadResult.error ?? "Please upload it from the saved experience card."}`;
                } else {
                  saved[saved.length - 1] = {
                    ...newExperience,
                    documentPath: uploadResult.path,
                    hasDocument: true,
                  };
                }
              } catch (error) {
                console.error("Work experience document upload failed after save.", error);
                followUpError = "Experience saved, but the document upload failed. You can try again from the saved experience card.";
              }
            }
            setItems(saved);
            return followUpError;
          });
        }}>
          <h3>{editingId ? "Edit experience" : items.length ? "Add another" : "Add work experience"}</h3>
          <div className="p-grid">
            <label className="p-field">Job title
              <input value={draft.title} maxLength={120} onChange={(e) => updateDraft("title", e.target.value)} />
            </label>
            <label className="p-field">Organization
              <input value={draft.organization} maxLength={120} onChange={(e) => updateDraft("organization", e.target.value)} />
            </label>
            <label className="p-field"><span>Location <em>(optional)</em></span>
              <input value={draft.location} maxLength={120} onChange={(e) => updateDraft("location", e.target.value)} />
            </label>
            <label className="p-field">From
              <input type="month" value={draft.startDate} onChange={(e) => updateDraft("startDate", e.target.value)} />
            </label>
            {!draft.current && (
              <label className="p-field">To
                <input type="month" value={draft.endDate} onChange={(e) => updateDraft("endDate", e.target.value)} />
              </label>
            )}
          </div>
          <label className="p-check-label">
            <input type="checkbox" checked={draft.current} onChange={(e) => {
              updateDraft("current", e.target.checked);
              if (e.target.checked) updateDraft("endDate", "");
            }} />
            I currently work here
          </label>
          <label className="p-field">Description <em>(optional)</em>
            <textarea rows={4} maxLength={1000} value={draft.description}
              onChange={(e) => updateDraft("description", e.target.value)} />
          </label>
          {!editingId && (
            <label className="p-field p-document-field">
              <span>Certificate or supporting document <em>(optional, private)</em></span>
              <input ref={draftFileInput} type="file" accept="application/pdf,image/jpeg,image/png"
                disabled={pending || removing} onChange={(e) => setDraftFile(e.target.files?.[0] ?? null)} />
              <p className="p-sub">One PDF, JPG or PNG up to 10 MB. It will upload after this experience is saved.</p>
            </label>
          )}
          {editingId && (
            <button type="button" className="p-btn" onClick={() => {
              clear();
              setDraft({ ...EMPTY_EXPERIENCE });
              setDraftFile(null);
              setEditingId(null);
            }}>
              Cancel
            </button>
          )}
          <SaveRow pending={pending || removing} msg={msg} label={editingId ? "Save changes" : "Add"} />
        </form>
      )}
      {items.length >= 20 && !editingId && <p className="p-sub">You can add up to 20 work experiences.</p>}
    </>
  );
}

export function BasicsForm({ profile }) {
  const [v, setV] = useState(profile);
  const { pending, msg, run } = useSaver(saveBasics);
  const toggle = (l) => setV((s) => ({ ...s, languages: s.languages.includes(l) ? s.languages.filter((x) => x !== l) : [...s.languages, l] }));

  return (
    <form className="p-form" onSubmit={(e) => {
      e.preventDefault();
      run({ title: v.title, institution: v.institution, languages: v.languages });
    }}>
      <div className="p-grid">
        <label className="p-field">Professional title
          <select value={v.title} onChange={(e) => setV({ ...v, title: e.target.value })}>
            <option value="">Select…</option>
            {TITLES.map((t) => <option key={t}>{t}</option>)}
          </select>
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
