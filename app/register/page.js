"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AuthShell from "@/components/AuthShell";
import { Field, PasswordField } from "@/components/Field";

const ROLES = [
  { value: "client", title: "I’d like support", text: "Find and book a psychologist." },
  { value: "psychologist", title: "I’m a psychologist", text: "Offer sessions and manage my schedule." },
];

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [role, setRole] = useState("client");
  const [values, setValues] = useState({ fullName: "", email: "", phone: "", password: "" });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const set = (k) => (e) => setValues((v) => ({ ...v, [k]: e.target.value }));

  async function onSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setErrors({});
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...values, role }),
      });
      const data = await res.json();
      if (!res.ok) return setErrors(data.errors ?? { form: "Something went wrong. Please try again." });
      router.push("/dashboard");
      router.refresh();
    } catch {
      setErrors({ form: "Can't reach Sakoon. Check your internet connection and try again." });
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell>
      <div className="progress" role="progressbar" aria-valuemin={1} aria-valuemax={2} aria-valuenow={step}
        aria-label={`Step ${step} of 2`}>
        <span style={{ width: step === 1 ? "50%" : "100%" }} />
      </div>

      {step === 1 ? (
        <>
          <h1>Create your account</h1>
          <p className="lead">How will you use Sakoon?</p>
          <div className="roles" role="radiogroup" aria-label="Account type">
            {ROLES.map((r) => (
              <button type="button" key={r.value} role="radio" aria-checked={role === r.value}
                className={`role ${role === r.value ? "on" : ""}`} onClick={() => setRole(r.value)}>
                <strong>{r.title}</strong>
                <span>{r.text}</span>
              </button>
            ))}
          </div>
          <button className="btn" type="button" onClick={() => setStep(2)}>Continue</button>
        </>
      ) : (
        <>
          <button type="button" className="back" onClick={() => setStep(1)}>← Back</button>
          <h1>Your details</h1>
          <p className="lead">
            {role === "psychologist"
              ? "You’ll add your credentials after this, so we can verify you."
              : "We’ll use these to confirm your bookings."}
          </p>
          <form onSubmit={onSubmit} noValidate>
            {errors.form && <div className="alert" role="alert">{errors.form}</div>}
            <Field id="fullName" label="Full name" autoComplete="name" value={values.fullName}
              onChange={set("fullName")} error={errors.fullName} required />
            <Field id="email" label="Email" type="email" autoComplete="email" inputMode="email"
              value={values.email} onChange={set("email")} error={errors.email} required />
            <Field id="phone" label="Phone number" type="tel" autoComplete="tel" inputMode="tel"
              placeholder="+92 300 1234567" value={values.phone} onChange={set("phone")} error={errors.phone} required />
            <PasswordField id="password" autoComplete="new-password" value={values.password}
              onChange={set("password")} error={errors.password}
              hint="At least 8 characters, with a letter and a number." required />
            <button className="btn" disabled={loading}>{loading ? "Creating account…" : "Create account"}</button>
            <p className="fine">By continuing you agree to our Terms of Service and Privacy Policy.</p>
          </form>
        </>
      )}

      <p className="switch">Already have an account? <Link href="/login">Sign in</Link></p>
    </AuthShell>
  );
}
