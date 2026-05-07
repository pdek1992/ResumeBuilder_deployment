import type { ReactNode } from "react";
import Link from "next/link";
import { BarChart3, Headphones, Rocket, Shield, Sparkles, Target } from "lucide-react";

import { LogoLockup } from "@/components/ui/logo-lockup";
import { buildWhatsappSupportLink } from "@/lib/whatsapp";

const featureItems = [
  {
    icon: BarChart3,
    eyebrow: "Impact Driven",
    title: "Outcome Optimization",
    body: "AI transforms weak bullets into metric-driven success stories. We highlight results that recruiters care about.",
  },
  {
    icon: Target,
    eyebrow: "Precision Match",
    title: "JD & Company Sync",
    body: "Paste any Job Description and watch the builder align your skills and keywords automatically.",
  },
  {
    icon: Shield,
    eyebrow: "ATS Shield",
    title: "Section Advice",
    body: "Get real-time suggestions to maximize your structural ATS score across all sections.",
  },
  {
    icon: Rocket,
    eyebrow: "Fast Start",
    title: "Smart Import",
    body: "Our engine structures raw text into a professional resume layout in seconds.",
  },
];

/**
 * Shows Sign In / Sign Up for guests; Dashboard + Sign Out for signed-in users.
 */
function SessionButton({ signedIn }: { signedIn: boolean }) {
  if (signedIn) {
    return (
      <div className="flex items-center gap-2">
        <Link
          href="/dashboard"
          className="rounded-full border border-primary/20 bg-primary/10 px-7 py-4 text-[11px] font-black uppercase tracking-[0.24em] text-primary shadow-[0_10px_28px_rgba(48,103,234,0.1)] transition hover:bg-primary/15"
        >
          My Dashboard
        </Link>
        <form action="/api/auth/logout" method="post">
          <button
            type="submit"
            className="rounded-full border border-slate-200 bg-white px-7 py-4 text-[11px] font-black uppercase tracking-[0.24em] text-slate-500 shadow-[0_10px_28px_rgba(15,23,42,0.05)] transition hover:bg-slate-50"
          >
            Sign Out
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Link
        href="/sign-in"
        className="rounded-full border border-slate-200 bg-white px-7 py-4 text-[11px] font-black uppercase tracking-[0.24em] text-slate-500 shadow-[0_10px_28px_rgba(15,23,42,0.05)] transition hover:bg-slate-50"
      >
        Sign In
      </Link>
      <Link
        href="/sign-up"
        className="rounded-full border border-primary bg-primary px-7 py-4 text-[11px] font-black uppercase tracking-[0.24em] text-white shadow-[0_10px_28px_rgba(48,103,234,0.22)] transition hover:brightness-105"
      >
        Sign Up Free
      </Link>
    </div>
  );
}

function SupportButton() {
  const href = buildWhatsappSupportLink("Resume Builder Support");

  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="flex h-14 w-14 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-800 shadow-[0_10px_28px_rgba(15,23,42,0.05)] transition hover:bg-slate-50"
      aria-label="Contact support"
    >
      <Headphones className="h-5 w-5" />
    </a>
  );
}

export function LegacyFlowShell({
  signedIn,
  rightColumn,
}: {
  signedIn: boolean;
  rightColumn: ReactNode;
}) {
  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#f7fbff_0%,#eef3ff_100%)] px-4 py-6 md:px-6 md:py-8">
      <div className="mx-auto max-w-[1400px]">
        {/* ── Top Nav ── */}
        <div className="mb-6 rounded-[2.2rem] border border-white/80 bg-white/70 px-4 py-3 shadow-[0_20px_60px_rgba(37,99,235,0.12)] backdrop-blur md:px-6">
          <div className="flex items-center justify-between gap-3">
            <LogoLockup />
            <div className="flex items-center gap-3">
              <SessionButton signedIn={signedIn} />
              <SupportButton />
            </div>
          </div>
        </div>

        {/* ── Auth banner for guests ── */}
        {!signedIn && (
          <div className="mb-6 flex items-center justify-between gap-4 rounded-[1.8rem] border border-amber-100 bg-amber-50 px-6 py-4">
            <p className="text-[12px] font-black uppercase tracking-[0.26em] text-amber-700">
              🔒 Sign in or create a free account to start building your resume
            </p>
            <div className="flex items-center gap-2">
              <Link
                href="/sign-in"
                className="rounded-full bg-white px-5 py-3 text-[11px] font-black uppercase tracking-[0.24em] text-amber-700 shadow-sm transition hover:bg-amber-50"
              >
                Sign In
              </Link>
              <Link
                href="/sign-up"
                className="rounded-full bg-amber-700 px-5 py-3 text-[11px] font-black uppercase tracking-[0.24em] text-white shadow-sm transition hover:bg-amber-800"
              >
                Sign Up
              </Link>
            </div>
          </div>
        )}

        <div className="flex flex-wrap items-start gap-6">
          {/* ── Left: Feature cards ── */}
          <section className="min-w-0 max-w-[420px] flex-[1_1_380px] rounded-[3rem] border border-white/70 bg-white/72 p-6 shadow-[0_30px_80px_rgba(37,99,235,0.12)] backdrop-blur md:p-8">
            <div className="mb-8 flex items-center gap-5">
              <div className="flex h-16 w-16 items-center justify-center rounded-[1.9rem] bg-white shadow-[0_16px_40px_rgba(15,23,42,0.12)]">
                <Sparkles className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h2 className="font-display text-[2.45rem] font-black leading-[0.94] tracking-tight text-slate-950 md:text-[3rem]">
                  AI-Powered
                  <br />
                  Excellence
                </h2>
                <p className="mt-2 text-[11px] font-black uppercase tracking-[0.28em] text-primary">VigilSiddhi Intelligence</p>
              </div>
            </div>

            <div className="space-y-5">
              {featureItems.map(({ icon: Icon, eyebrow, title, body }) => (
                <div
                  key={title}
                  className="rounded-[2.2rem] border border-slate-100 bg-white px-5 py-6 shadow-[0_14px_40px_rgba(15,23,42,0.04)]"
                >
                  <div className="flex items-start gap-4">
                    <div className="mt-1 flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-50 text-slate-800">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-[11px] font-black uppercase tracking-[0.26em] text-slate-400">{eyebrow}</p>
                      <h3 className="mt-3 text-[1.75rem] font-black tracking-tight text-slate-950 md:text-[1.8rem]">{title}</h3>
                      <p className="mt-3 text-[15px] leading-8 text-slate-500">{body}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 rounded-[2.2rem] bg-slate-950 px-6 py-6 text-white shadow-[0_20px_50px_rgba(15,23,42,0.18)]">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.28em] text-blue-200">Pro Full Pass</p>
                  <p className="mt-3 text-3xl font-black tracking-tight">&#8377;100 Only</p>
                </div>
              </div>
              <p className="mt-4 text-sm leading-7 text-slate-300">
                One-time payment gives full day (24h) to re-edit resume with multiple templates and secure downloads.
              </p>
            </div>
          </section>

          {/* ── Right: Entry card (sign-in/up form or builder) ── */}
          <div className="min-w-0 flex-[2_1_560px]">{rightColumn}</div>
        </div>
      </div>
    </main>
  );
}
