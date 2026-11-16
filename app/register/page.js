"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AuthShell from "@/components/AuthShell";
import { Field, PasswordField, SelectField } from "@/components/Field";
import { TITLES, SPECIALIZATIONS } from "@/lib/options.mjs";

const ROLES = [
  { value: "client", title: "I’d like support", text: "Find and book a psychologist." },
  { value: "psychologist", title: "I’m a psychologist", text: "Offer sessions and manage my schedule." },
];

// Which step each field lives on, so a server error sends the person back to the right screen.
const STEP_OF = {
  fullName: 2, email: 2, phone: 2, password: 2,
  title: 3, specialization: 3, experienceYears: 3,
  qualification: 4, institution: 4, licenseNumber: 4, licenseBody: 4,
};

const EMPTY = {
  fullName: "", email: "", phone: "", password: "",
  title: "", specialization: "", experienceYears: "",
  qualification: "", institution: "", licenseNumber: "", licenseBody: "",
};

function localErrors(step, v) {
  const e = {};
  if (step === 2) {
    if (v.fullName.trim().length < 2) e.fullName = "Enter your full name.";
    if (!/^\S+@\S+\.\S+$/.test(v.email.trim())) e.email = "Enter a valid email address.";
    if (!/^\+?[0-9\s-]{7,18}$/.test(v.phone.trim())) e.phone = "Enter a valid phone number, for example +92 300 1234567.";
    if (v.password.length < 8) e.password = "Use at least 8 characters.";
    else if (!/[A-Za-z]/.test(v.password)) e.password = "Include at least one letter.";
    else if (!/[0-9]/.test(v.password)) e.password = "Include at least one number.";
  }
  if (step === 3) {
    if (!v.title) e.title = "Choose your professional title.";
    if (!v.specialization) e.specialization = "Choose your main area of practice.";
    const n = Number(v.experienceYears);
    if (v.experienceYears === "" || !Number.isInteger(n) || n < 0 || n > 60)
      e.experienceYears = "Enter your years of experience (0–60).";
  }
  if (step === 4) {
    if (v.qualification.trim().length < 2) e.qualification = "Enter your highest qualification, e.g. M.Sc Clinical Psychology.";
    if (v.institution.trim().length < 2) e.institution = "Enter the institution you studied at.";
    if (v.licenseNumber.trim() && !v.licenseBody.trim()) e.licenseBody = "Enter who issued this licence.";
  }
  return e;
}

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [role, setRole] = useState("client");
  const [values, setValues] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const isPsy = role === "psychologist";
  const last = isPsy ? 4 : 2;
  const set = (k) => (e) => setValues((v) => ({ ...v, [k]: e.target.value }));
  const err = (k) => errors[k];

  async function submit() {
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...values, role }),
      });
      const data = await res.json();
      if (!res.ok) {
        const errs = data.errors ?? { form: "Something went wrong. Please try again." };
        const steps = Object.keys(errs).map((k) => STEP_OF[k]).filter(Boolean);
        if (steps.length) setStep(Math.min(...steps));
        return setErrors(errs);
      }
      router.push("/dashboard");
      router.refresh();
    } catch {
      setErrors({ form: "Can't reach Sakoon. Check your internet connection and try again." });
    } finally {
      setLoading(false);
    }
  }

  function onSubmit(e) {
    e.preventDefault();
    const found = localErrors(step, values);
    if (Object.keys(found).length) return setErrors(found);
    setErrors({});
    if (step < last) setStep(step + 1);
    else submit();
  }

  const heading = {
    2: ["Your details", isPsy ? "We’ll use these to contact you about your application." : "We’ll use these to confirm your bookings."],
    3: ["Your practice", "This appears on your public profile. You can change it any time."],
    4: ["Your credentials", "Our team verifies these before your profile goes live."],
  }[step];

  return (
    <AuthShell>
      <div className="progress" role="progressbar" aria-valuemin={1} aria-valuemax={last} aria-valuenow={step}
        aria-label={`Step ${step} of ${last}`}>
        <span style={{ width: `${(step / last) * 100}%` }} />
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
          <button type="button" className="back" onClick={() => { setErrors({}); setStep(step - 1); }}>← Back</button>
          <h1>{heading[0]}</h1>
          <p className="lead">{heading[1]}</p>

          <form onSubmit={onSubmit} noValidate>
            {errors.form && <div className="alert" role="alert">{errors.form}</div>}

            {step === 2 && (
              <>
                <Field id="fullName" label="Full name" autoComplete="name" value={values.fullName}
                  onChange={set("fullName")} error={err("fullName")} required />
                <Field id="email" label="Email" type="email" autoComplete="email" inputMode="email"
                  value={values.email} onChange={set("email")} error={err("email")} required />
                <Field id="phone" label="Phone number" type="tel" autoComplete="tel" inputMode="tel"
                  placeholder="+92 300 1234567" value={values.phone} onChange={set("phone")} error={err("phone")} required />
                <PasswordField id="password" autoComplete="new-password" value={values.password}
                  onChange={set("password")} error={err("password")}
                  hint="At least 8 characters, with a letter and a number." required />
              </>
            )}

            {step === 3 && (
              <>
                <SelectField id="title" label="Professional title" options={TITLES} value={values.title}
                  onChange={set("title")} error={err("title")} />
                <SelectField id="specialization" label="Main area of practice" options={SPECIALIZATIONS}
                  value={values.specialization} onChange={set("specialization")} error={err("specialization")}
                  hint="You can add more specializations after signing up." />
                <Field id="experienceYears" label="Years of experience" type="number" min="0" max="60"
                  inputMode="numeric" value={values.experienceYears} onChange={set("experienceYears")}
                  error={err("experienceYears")} />
              </>
            )}

            {step === 4 && (
              <>
                <Field id="qualification" label="Highest qualification" placeholder="e.g. M.Sc Clinical Psychology"
                  value={values.qualification} onChange={set("qualification")} error={err("qualification")} />
                <Field id="institution" label="University or institution" value={values.institution}
                  onChange={set("institution")} error={err("institution")} />
                <Field id="licenseNumber" label="Licence or registration number (optional)"
                  value={values.licenseNumber} onChange={set("licenseNumber")} error={err("licenseNumber")}
                  hint="You’ll need this to go live. You can add it later." />
                {values.licenseNumber.trim() && (
                  <Field id="licenseBody" label="Issued by" placeholder="e.g. Pakistan Association of Clinical Psychologists"
                    value={values.licenseBody} onChange={set("licenseBody")} error={err("licenseBody")} />
                )}
              </>
            )}

            <button className="btn" disabled={loading}>
              {loading ? "Creating account…" : step < last ? "Continue" : "Create account"}
            </button>
            {step === last && <p className="fine">By continuing you agree to our Terms of Service and Privacy Policy.</p>}
          </form>
        </>
      )}

      <p className="switch">Already have an account? <Link href="/login">Sign in</Link></p>
    </AuthShell>
  );
}
