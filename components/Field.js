"use client";
import { useState } from "react";

export function Field({ label, error, hint, id, ...props }) {
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <input id={id} aria-invalid={!!error} aria-describedby={error ? `${id}-e` : hint ? `${id}-h` : undefined} {...props} />
      {error ? (
        <p className="error" id={`${id}-e`} role="alert">{error}</p>
      ) : hint ? (
        <p className="hint" id={`${id}-h`}>{hint}</p>
      ) : null}
    </div>
  );
}

export function PasswordField({ label = "Password", error, hint, id, ...props }) {
  const [show, setShow] = useState(false);
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <div className="pw">
        <input id={id} type={show ? "text" : "password"} aria-invalid={!!error}
          aria-describedby={error ? `${id}-e` : hint ? `${id}-h` : undefined} {...props} />
        <button type="button" className="pw-toggle" onClick={() => setShow((s) => !s)} aria-pressed={show}>
          {show ? "Hide" : "Show"}
        </button>
      </div>
      {error ? (
        <p className="error" id={`${id}-e`} role="alert">{error}</p>
      ) : hint ? (
        <p className="hint" id={`${id}-h`}>{hint}</p>
      ) : null}
    </div>
  );
}
