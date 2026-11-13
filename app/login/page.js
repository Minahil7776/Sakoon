"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AuthShell from "@/components/AuthShell";
import { Field, PasswordField } from "@/components/Field";

export default function LoginPage() {
  const router = useRouter();
  const [values, setValues] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const set = (k) => (e) => setValues((v) => ({ ...v, [k]: e.target.value }));

  async function onSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setErrors({});
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
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
      <h1>Welcome back</h1>
      <p className="lead">Sign in to see your sessions.</p>

      <form onSubmit={onSubmit} noValidate>
        {errors.form && <div className="alert" role="alert">{errors.form}</div>}
        <Field id="email" label="Email" type="email" autoComplete="email" inputMode="email"
          value={values.email} onChange={set("email")} error={errors.email} required />
        <PasswordField id="password" autoComplete="current-password"
          value={values.password} onChange={set("password")} error={errors.password} required />
        <button className="btn" disabled={loading}>{loading ? "Signing in…" : "Sign in"}</button>
      </form>

      <p className="switch">New to Sakoon? <Link href="/register">Create an account</Link></p>
    </AuthShell>
  );
}
