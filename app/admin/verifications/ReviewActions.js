"use client";
import { useState, useTransition } from "react";
import ConfirmDialog from "@/components/admin/ConfirmDialog";
import { reviewPsychologist } from "../actions";
import { ICheck, IX } from "../icons";

const COPY = {
  approved: { label: "Approve", title: "Approve this psychologist?", body: "They’ll appear in public search and can accept paid bookings.", tone: "primary" },
  additional_info_required: { label: "Request info", title: "Ask for more information?", body: "Tell them exactly what’s missing. They’ll see this message.", tone: "warn", note: true },
  rejected: { label: "Reject", title: "Reject this application?", body: "Give a clear reason so the applicant understands. They’ll see it.", tone: "danger", note: true },
};

export default function ReviewActions({ userId, name, current, compact = false }) {
  const [target, setTarget] = useState(null);
  const [error, setError] = useState("");
  const [pending, start] = useTransition();
  const c = target && COPY[target];

  const close = () => { setTarget(null); setError(""); };
  const confirm = (note) =>
    start(async () => {
      const res = await reviewPsychologist({ userId, decision: target, note });
      if (res.ok) close(); else setError(res.error);
    });

  return (
    <>
      {compact ? (
        <div className="a-icons">
          <button className="a-ico bad" aria-label={`Reject ${name}`} title="Reject"
            onClick={() => { setError(""); setTarget("rejected"); }}><IX size={16} /></button>
          <button className="a-ico ok" aria-label={`Approve ${name}`} title="Approve"
            onClick={() => { setError(""); setTarget("approved"); }}><ICheck size={16} /></button>
        </div>
      ) : (
        <div className="a-row-actions">
        {Object.keys(COPY).filter((d) => d !== current).map((d) => (
          <button key={d} className={`a-btn sm ${d === "approved" ? "solid primary" : ""}`}
            onClick={() => { setError(""); setTarget(d); }}>{COPY[d].label}</button>
        ))}
        </div>
      )}
      <ConfirmDialog
        open={!!target}
        title={c ? c.title.replace("this psychologist", name) : ""}
        body={c?.body}
        confirmLabel={c?.label}
        tone={c?.tone}
        noteLabel={c?.note ? "Message to the psychologist" : undefined}
        noteRequired={!!c?.note}
        pending={pending}
        error={error}
        onConfirm={confirm}
        onClose={close}
      />
    </>
  );
}
