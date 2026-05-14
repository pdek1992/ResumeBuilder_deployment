"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { getSupabaseBrowserClient } from "@/lib/supabase/browser";
import { apiFetch } from "@/lib/client-api";

const fieldClassName =
  "mt-3 w-full rounded-[1.9rem] border-2 border-transparent bg-slate-50 px-6 py-5 text-[17px] font-semibold text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-primary focus:bg-white";
const labelClassName = "ml-2 text-[11px] font-black uppercase tracking-[0.3em] text-slate-400";

export function SignUpForm({ defaultMobile = "", next = "/builder/import" }: { defaultMobile?: string; next?: string }) {
  const router = useRouter();
  const supabase = getSupabaseBrowserClient();
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    mobile: defaultMobile,
    email: "",
    password: "",
    consent: false,
    terms: false,
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");

    if (!form.consent || !form.terms) {
      setError("Privacy Policy and Terms consent are required.");
      setLoading(false);
      return;
    }

    const { data, error: signUpError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        emailRedirectTo: `${window.location.origin}/api/auth/callback?next=${encodeURIComponent(next)}`,
        data: {
          first_name: form.firstName,
          last_name: form.lastName,
          mobile: form.mobile,
          auth_provider: "password",
        },
      },
    });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    if (!data.session) {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: form.email,
        password: form.password,
      });

      if (signInError) {
        setError(signInError.message);
        setLoading(false);
        return;
      }
    }

    await apiFetch("/api/auth/session-event", {
      method: "POST",
      body: JSON.stringify({
        event: "signup",
        profile: {
          first_name: form.firstName,
          last_name: form.lastName,
          mobile: form.mobile,
          consent_given: true,
          consent_timestamp: new Date().toISOString(),
          auth_provider: "password",
        },
      }),
    }).catch((err) => {
      console.error("Session event logging failed:", err);
    });

    router.push(next);
    router.refresh();
  }

  const update = (key: keyof typeof form, value: string | boolean) => setForm((current) => ({ ...current, [key]: value }));

  return (
    <section className="rounded-[3rem] border border-white/70 bg-white/82 px-6 py-8 shadow-[0_30px_80px_rgba(37,99,235,0.12)] backdrop-blur md:px-10 md:py-10">
      <p className="text-[12px] font-black uppercase tracking-[0.32em] text-primary">Step 1: Identity</p>
      <h1 className="mt-6 font-display text-[3.3rem] font-black leading-[0.92] tracking-tight text-slate-950 md:text-[5.1rem]">
        Your Next Career
        <br />
        Move Starts
        <br />
        <span className="text-primary">Now</span>
      </h1>
      <p className="mt-8 max-w-2xl text-[18px] leading-10 text-slate-500 md:text-[1.45rem] md:leading-[2.8rem]">
        Your first and last name are permanently locked after signup. To change them later, support approval is required.
      </p>

      <form className="mt-10 grid gap-6 md:grid-cols-2" onSubmit={handleSubmit}>
        <div>
          <label htmlFor="firstName" className={labelClassName}>
            First Name
          </label>
          <input
            id="firstName"
            value={form.firstName}
            onChange={(event) => update("firstName", event.target.value)}
            className={fieldClassName}
            required
          />
        </div>

        <div>
          <label htmlFor="lastName" className={labelClassName}>
            Last Name
          </label>
          <input
            id="lastName"
            value={form.lastName}
            onChange={(event) => update("lastName", event.target.value)}
            className={fieldClassName}
            required
          />
        </div>

        <div>
          <label htmlFor="mobile" className={labelClassName}>
            Mobile Number
          </label>
          <input
            id="mobile"
            value={form.mobile}
            onChange={(event) => update("mobile", event.target.value)}
            className={fieldClassName}
            required
          />
        </div>

        <div>
          <label htmlFor="email" className={labelClassName}>
            Email Address
          </label>
          <input
            id="email"
            type="email"
            value={form.email}
            onChange={(event) => update("email", event.target.value)}
            className={fieldClassName}
            required
          />
        </div>

        <div className="md:col-span-2">
          <label htmlFor="password" className={labelClassName}>
            Password
          </label>
          <input
            id="password"
            type="password"
            value={form.password}
            onChange={(event) => update("password", event.target.value)}
            className={fieldClassName}
            required
          />
        </div>

        <label className="md:col-span-2 flex items-start gap-3 rounded-[2rem] border border-slate-200 bg-slate-50 p-5 text-sm leading-7 text-slate-600">
          <input type="checkbox" className="mt-1" checked={form.consent} onChange={(event) => update("consent", event.target.checked)} />
          <span>I consent to personal data processing, AI processing, storage, and support handling as described in the Privacy Policy.</span>
        </label>

        <label className="md:col-span-2 flex items-start gap-3 rounded-[2rem] border border-slate-200 bg-slate-50 p-5 text-sm leading-7 text-slate-600">
          <input type="checkbox" className="mt-1" checked={form.terms} onChange={(event) => update("terms", event.target.checked)} />
          <span>I accept the Terms of Use and understand that payment-gated downloads are validated server-side only.</span>
        </label>

        {error ? <p className="md:col-span-2 text-sm text-rose-600">{error}</p> : null}

        <div className="md:col-span-2">
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-[2rem] bg-primary py-5 text-[15px] font-black uppercase tracking-[0.28em] text-white shadow-[0_24px_54px_rgba(48,103,234,0.25)] transition hover:brightness-105 disabled:opacity-60"
          >
            {loading ? "Creating Account" : "Create Account"}
          </button>
        </div>
      </form>

      <p className="mt-8 text-center text-[13px] font-semibold text-slate-500">
        Already have an account?{" "}
        <Link href={`/sign-in?next=${encodeURIComponent(next)}`} className="text-primary">
          Sign in
        </Link>
      </p>
    </section>
  );
}
