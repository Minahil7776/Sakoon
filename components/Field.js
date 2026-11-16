"use client";
import { useState } from "react";
import "./field-select.css";

const Msg = ({ id, error, hint }) =>
  error ? <p className="error" id={`${id}-e`} role="alert">{error}</p>
  : hint ? <p className="hint" id={`${id}-h`}>{hint}</p> : null;

const describe = (id, error, hint) => (error ? `${id}-e` : hint ? `${id}-h` : undefined);

export function Field({ label, error, hint, id, ...props }) {
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <input id={id} aria-invalid={!!error} aria-describedby={describe(id, error, hint)} {...props} />
      <Msg id={id} error={error} hint={hint} />
    </div>
  );
}

export function SelectField({ label, error, hint, id, options, placeholder = "Select…", ...props }) {
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <select id={id} aria-invalid={!!error} aria-describedby={describe(id, error, hint)} {...props}>
        <option value="">{placeholder}</option>
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
      <Msg id={id} error={error} hint={hint} />
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
          aria-describedby={describe(id, error, hint)} {...props} />
        <button type="button" className="pw-toggle" onClick={() => setShow((s) => !s)} aria-pressed={show}>
          {show ? "Hide" : "Show"}
        </button>
      </div>
      <Msg id={id} error={error} hint={hint} />
    </div>
  );
}
