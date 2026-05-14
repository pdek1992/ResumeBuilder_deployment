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
      const params = new URLSearchParams({ next: "/builder/import" });
      if (mobile.trim()) {
        params.set("mobile", mobile.trim());
      }
      router.push(`/sign-up?${params.toString()}`);
      return;
    }
    const query = mobile.trim()
      ? `?mobile=${encodeURIComponent(mobile.trim())}`
      : "";
    router.push(`/builder/import${query}`);
  }

  return (
    <section className="rounded-[2.5rem] bg-white p-6 shadow-sm md:p-12 lg:p-16 h-full flex flex-col justify-center">
      <p className="text-[10px] font-black uppercase tracking-widest text-blue-600 mb-6">
        Step 1: Identity
      </p>
      <h1 className="font-display text-[3rem] md:text-[4rem] font-black leading-[1.05] tracking-tight text-gray-900">
        Your Next Career
        <br />
        Move Starts <span className="text-blue-600 underline decoration-blue-200 underline-offset-[12px] decoration-4">Now</span>
      </h1>
      <p className="mt-8 max-w-2xl text-[16px] leading-relaxed text-gray-500 font-medium">
        Create a premium, ATS-optimized resume in minutes. &#8377;100 gives you
        24h unlimited access, multiple templates, and AI-powered refinements.
      </p>

      <div className="mt-12">
        <label
          htmlFor="landing-mobile"
          className="ml-4 text-[10px] font-black uppercase tracking-widest text-gray-400"
        >
          Enter Mobile Number
        </label>
        <input
          id="landing-mobile"
          type="tel"
          inputMode="numeric"
          value={mobile}
          onChange={(event) => setMobile(event.target.value)}
          placeholder="9823340379"
          className="mt-3 w-full rounded-full border-0 bg-gray-50/80 px-8 py-5 text-[18px] font-bold text-gray-800 outline-none transition placeholder:text-gray-300 focus:bg-gray-100 focus:ring-2 focus:ring-blue-100"
        />
        <p className="mt-4 px-4 text-[9px] font-black uppercase tracking-widest text-gray-400">
          Used for draft recovery &amp; 24h access support.
          <span className="text-blue-600"> 10-digit number required.</span>
        </p>
      </div>

      <button
        type="button"
        onClick={handleStart}
        className="mt-10 w-full rounded-full bg-blue-600 py-5 text-[13px] font-black uppercase tracking-widest text-white transition hover:bg-blue-700 shadow-md shadow-blue-600/20"
      >
        Start Building &mdash; &#8377;100
      </button>

      {!signedIn && (
        <div className="mt-8 flex flex-col gap-4">
          <div className="flex items-center gap-4">
            <div className="h-px flex-1 bg-gray-100" />
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
              Already a member?
            </p>
            <div className="h-px flex-1 bg-gray-100" />
          </div>
          <Link
            href="/sign-in"
            className="flex w-full items-center justify-center rounded-full border-2 border-gray-100 bg-white py-4 text-[12px] font-bold uppercase tracking-widest text-gray-500 transition hover:border-gray-200 hover:text-gray-700"
          >
            Sign In to Your Account
          </Link>
        </div>
      )}

      {signedIn && (
        <div className="mt-8">
          <Link
            href="/dashboard"
            className="block w-full rounded-full border-2 border-gray-100 bg-white py-4 text-center text-[12px] font-bold uppercase tracking-widest text-gray-500 transition hover:border-gray-200 hover:text-gray-700"
          >
            Go to My Dashboard
          </Link>
        </div>
      )}
    </section>
  );
}
