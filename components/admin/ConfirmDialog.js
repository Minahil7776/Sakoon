"use client";
import { useEffect, useRef, useState } from "react";

export default function ConfirmDialog({
  open, title, body, confirmLabel, tone = "primary",
  noteLabel, noteRequired, pending, error, onConfirm, onClose,
}) {
  const ref = useRef(null);
  const [note, setNote] = useState("");

  useEffect(() => {
    const d = ref.current;
    if (open && !d.open) { setNote(""); d.showModal(); }
    if (!open && d.open) d.close();
  }, [open]);

  return (
    <dialog ref={ref} className="a-dlg" onClose={onClose}>
      <form method="dialog" onSubmit={(e) => { e.preventDefault(); onConfirm(note); }}>
        <h2>{title}</h2>
        <p>{body}</p>
        {noteLabel && (
          <label className="a-note">
            {noteLabel}
            <textarea rows={3} maxLength={500} value={note} onChange={(e) => setNote(e.target.value)}
              required={noteRequired} />
          </label>
        )}
        {error && <p className="a-err" role="alert">{error}</p>}
        <div className="a-dlg-actions">
          <button type="button" className="a-btn" onClick={onClose} disabled={pending}>Cancel</button>
          <button className={`a-btn solid ${tone}`} disabled={pending}>{pending ? "Saving…" : confirmLabel}</button>
        </div>
      </form>
    </dialog>
  );
}
