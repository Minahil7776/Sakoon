"use client";
import { useState, useTransition } from "react";
import { setInstant, resubmitForReview } from "./actions";

export function InstantToggle({ enabled }) {
  const [on, setOn] = useState(enabled);
  const [error, setError] = useState("");
  const [pending, start] = useTransition();

  const toggle = () =>
    start(async () => {
      setError("");
      const res = await setInstant(!on);
      if (res.ok) setOn(!on); else setError(res.error);
    });

  return (
    <div className="p-instant">
      <button role="switch" aria-checked={on} className={`p-switch ${on ? "on" : ""}`} onClick={toggle} disabled={pending}>
        <i /><span>{on ? "Accepting instant calls" : "Instant calls off"}</span>
      </button>
      {error && <p className="p-err" role="alert">{error}</p>}
    </div>
  );
}

export function ResubmitButton() {
  const [error, setError] = useState("");
  const [pending, start] = useTransition();
  return (
    <>
      <button className="p-btn solid" disabled={pending}
        onClick={() => start(async () => { setError(""); const r = await resubmitForReview(); if (!r.ok) setError(r.error); })}>
        {pending ? "Submitting…" : "Resubmit for review"}
      </button>
      {error && <p className="p-err" role="alert">{error}</p>}
    </>
  );
}
