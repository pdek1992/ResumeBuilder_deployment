"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export function LandingEntryCard({ signedIn }: { signedIn: boolean }) {
  const router = useRouter();
  const [mobile, setMobile] = useState("");

  function handleStart() {
    // Always enforce authentication before builder
    if (!signedIn) {
      router.push("/sign-up");
      return;
    }
    const query = mobile.trim() ? `?mobile=${encodeURIComponent(mobile.trim())}` : "";
    router.push(`/builder/import${query}`);
  }

  // ── Signed-in: show builder entry ──────────────────────────────────────────
  if (signedIn) {
    return (
      <section className="rounded-[3rem] border border-white/70 bg-white/82 px-6 py-8 shadow-[0_30px_80px_rgba(37,99,235,0.12)] backdrop-blur md:px-10 md:py-10">
        <p className="text-[12px] font-black uppercase tracking-[0.32em] text-primary">Step 1: Start</p>
        <h1 className="mt-6 font-display text-[3.65rem] font-black leading-[0.92] tracking-tight text-slate-950 md:text-[5.7rem]">
          Your Next Career
          <br />
          Move Starts
          <br />
          <span className="text-primary">Now</span>
        </h1>
        <p className="mt-8 max-w-2xl text-[18px] leading-10 text-slate-500 md:text-[1.75rem] md:leading-[3.2rem]">
          Create a premium, ATS-optimized resume in minutes. &#8377;100 gives you 24h unlimited access, multiple
          templates, and AI-powered refinements.
        </p>

        <div className="mt-12">
          <label htmlFor="landing-mobile" className="ml-2 text-[11px] font-black uppercase tracking-[0.32em] text-slate-400">
            Enter Mobile Number
          </label>
          <input
            id="landing-mobile"
            type="tel"
            inputMode="numeric"
            value={mobile}
            onChange={(event) => setMobile(event.target.value)}
            placeholder="985012XXXX"
            className="mt-4 w-full rounded-[1.9rem] border-2 border-transparent bg-slate-50 px-6 py-5 text-[20px] font-bold text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-primary focus:bg-white"
          />
          <p className="mt-5 px-2 text-[11px] font-black uppercase tracking-[0.27em] text-slate-400">
            Used for draft recovery &amp; 24h access support.
            <span className="text-primary"> 10-digit number required.</span>
          </p>
        </div>

        <button
          type="button"
          onClick={handleStart}
          className="mt-10 w-full rounded-[2rem] bg-primary py-5 text-[15px] font-black uppercase tracking-[0.28em] text-white shadow-[0_24px_54px_rgba(48,103,234,0.25)] transition hover:brightness-105"
        >
          Start Building &mdash; &#8377;100
        </button>

        <div className="mt-8">
          <Link
            href="/dashboard"
            className="block w-full rounded-[2rem] border-2 border-slate-200 py-4 text-center text-[13px] font-black uppercase tracking-[0.26em] text-slate-500 transition hover:border-primary hover:text-primary"
          >
            Go to My Dashboard
          </Link>
        </div>

        <div className="mt-10 grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-xl font-black text-slate-950">100%</p>
            <p className="mt-2 text-[11px] font-black uppercase tracking-[0.24em] text-slate-400">ATS Friendly</p>
          </div>
          <div>
            <p className="text-xl font-black text-slate-950">Unlimited</p>
            <p className="mt-2 text-[11px] font-black uppercase tracking-[0.24em] text-slate-400">Template Swaps</p>
          </div>
          <div>
            <p className="text-xl font-black text-slate-950">Secure</p>
            <p className="mt-2 text-[11px] font-black uppercase tracking-[0.24em] text-slate-400">Private Build</p>
          </div>
        </div>
      </section>
    );
  }

  // ── Guest: show sign-in / sign-up entry ────────────────────────────────────
  return (
    <section className="rounded-[3rem] border border-white/70 bg-white/82 px-6 py-8 shadow-[0_30px_80px_rgba(37,99,235,0.12)] backdrop-blur md:px-10 md:py-10">
      <p className="text-[12px] font-black uppercase tracking-[0.32em] text-primary">Step 1: Identity</p>
      <h1 className="mt-6 font-display text-[3.65rem] font-black leading-[0.92] tracking-tight text-slate-950 md:text-[5.7rem]">
        Your Next Career
        <br />
        Move Starts
        <br />
        <span className="text-primary">Now</span>
      </h1>
      <p className="mt-8 max-w-2xl text-[18px] leading-10 text-slate-500 md:text-[1.75rem] md:leading-[3.2rem]">
        Create a premium, ATS-optimized resume in minutes. Sign up free, then pay &#8377;100 for 24h unlimited access
        and AI-powered refinements.
      </p>

      {/* Primary CTA: Sign Up */}
      <Link
        href="/sign-up"
        className="mt-12 flex w-full items-center justify-center rounded-[2rem] bg-primary py-5 text-[15px] font-black uppercase tracking-[0.28em] text-white shadow-[0_24px_54px_rgba(48,103,234,0.25)] transition hover:brightness-105"
      >
        Create Free Account &mdash; Start Building
      </Link>

      {/* Divider */}
      <div className="mt-8 flex items-center gap-4">
        <div className="h-px flex-1 bg-slate-200" />
        <p className="text-[11px] font-black uppercase tracking-[0.28em] text-slate-400">Already a member?</p>
        <div className="h-px flex-1 bg-slate-200" />
      </div>

      {/* Secondary CTA: Sign In */}
      <Link
        href="/sign-in"
        className="mt-6 flex w-full items-center justify-center rounded-[2rem] border-2 border-slate-200 py-5 text-[15px] font-black uppercase tracking-[0.28em] text-slate-600 transition hover:border-primary hover:text-primary"
      >
        Sign In to Your Account
      </Link>

      <div className="mt-10 grid grid-cols-3 gap-4 text-center">
        <div>
          <p className="text-xl font-black text-slate-950">Free</p>
          <p className="mt-2 text-[11px] font-black uppercase tracking-[0.24em] text-slate-400">Sign Up</p>
        </div>
        <div>
          <p className="text-xl font-black text-slate-950">18+</p>
          <p className="mt-2 text-[11px] font-black uppercase tracking-[0.24em] text-slate-400">Templates</p>
        </div>
        <div>
          <p className="text-xl font-black text-slate-950">Secure</p>
          <p className="mt-2 text-[11px] font-black uppercase tracking-[0.24em] text-slate-400">Private Build</p>
        </div>
      </div>
    </section>
  );
}
