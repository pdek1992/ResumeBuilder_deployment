"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { getSupabaseBrowserClient } from "@/lib/supabase/browser";
import { apiFetch } from "@/lib/client-api";

const fieldClassName =
  "mt-3 w-full rounded-[1.9rem] border-2 border-transparent bg-slate-50 px-6 py-5 text-[17px] font-semibold text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-primary focus:bg-white";
const labelClassName = "ml-2 text-[11px] font-black uppercase tracking-[0.3em] text-slate-400";

export function SignInForm() {
  const router = useRouter();
  const supabase = getSupabaseBrowserClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handlePasswordSignIn(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      setError(signInError.message);
      setLoading(false);
      return;
    }

    await apiFetch("/api/auth/session-event", {
      method: "POST",
      body: JSON.stringify({ event: "login" }),
    }).catch(() => undefined);

    router.push("/dashboard");
    router.refresh();
  }

  async function handleGoogleSignIn() {
    setLoading(true);
    setError("");

    const redirectTo = `${window.location.origin}/api/auth/callback?next=/dashboard`;
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo,
      },
    });

    if (oauthError) {
      setError(oauthError.message);
      setLoading(false);
    }
  }

  return (
    <section className="rounded-[3rem] border border-white/70 bg-white/82 px-6 py-8 shadow-[0_30px_80px_rgba(37,99,235,0.12)] backdrop-blur md:px-10 md:py-10">
      <p className="text-[12px] font-black uppercase tracking-[0.32em] text-primary">Step 1: Access</p>
      <h1 className="mt-6 font-display text-[3.1rem] font-black leading-[0.92] tracking-tight text-slate-950 md:text-[4.7rem]">
        Resume Workspace
        <br />
        <span className="text-primary">Ready</span>
      </h1>
      <p className="mt-8 max-w-2xl text-[18px] leading-10 text-slate-500 md:text-[1.45rem] md:leading-[2.8rem]">
        Resume drafts, payments, downloads, and AI history restore automatically after sign-in.
      </p>

      <form className="mt-10 space-y-6" onSubmit={handlePasswordSignIn}>
        <div>
          <label htmlFor="email" className={labelClassName}>
            Email Address
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className={fieldClassName}
            required
          />
        </div>

        <div>
          <label htmlFor="password" className={labelClassName}>
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className={fieldClassName}
            required
          />
        </div>

        {error ? <p className="text-sm text-rose-600">{error}</p> : null}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-[2rem] bg-primary py-5 text-[15px] font-black uppercase tracking-[0.28em] text-white shadow-[0_24px_54px_rgba(48,103,234,0.25)] transition hover:brightness-105 disabled:opacity-60"
        >
          {loading ? "Signing In" : "Sign In"}
        </button>
      </form>

      <button
        type="button"
        onClick={handleGoogleSignIn}
        disabled={loading}
        className="mt-5 w-full rounded-[2rem] border border-slate-200 bg-white py-5 text-[13px] font-black uppercase tracking-[0.24em] text-slate-600 shadow-[0_12px_30px_rgba(15,23,42,0.05)] transition hover:bg-slate-50 disabled:opacity-60"
      >
        Google SSO
      </button>

      <p className="mt-8 text-center text-[13px] font-semibold text-slate-500">
        Need an account?{" "}
        <Link href="/sign-up" className="text-primary">
          Create one
        </Link>
      </p>
    </section>
  );
}
