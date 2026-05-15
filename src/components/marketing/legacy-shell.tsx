import type { ReactNode } from "react";
import Link from "next/link";
import { BarChart3, Headphones, Rocket, Shield, Sparkles, Target } from "lucide-react";

import { LogoLockup } from "@/components/ui/logo-lockup";
import { buildWhatsappSupportLink } from "@/lib/whatsapp";

const featureItems = [
  {
    icon: BarChart3,
    eyebrow: "IMPACT DRIVEN",
    title: "Outcome Optimization",
    body: "AI transforms weak bullets into metric-driven success stories. We highlight results that recruiters care about.",
  },
  {
    icon: Target,
    eyebrow: "PRECISION MATCH",
    title: "JD & Company Sync",
    body: "Paste any Job Description and watch the builder align your skills and keywords automatically.",
  },
  {
    icon: Shield,
    eyebrow: "ATS SHIELD",
    title: "Section Advice",
    body: "Get real-time suggestions to maximize your structural ATS score across all sections.",
  },
  {
    icon: Rocket,
    eyebrow: "FAST START",
    title: "Smart Import",
    body: "Our engine structures raw text into a professional resume layout in seconds.",
  },
];

function SessionButton({ signedIn, profileName }: { signedIn: boolean; profileName?: string }) {
  if (signedIn) {
    return (
      <div className="flex items-center gap-3">
        {profileName && (
          <span className="text-[12px] font-bold text-gray-700 mr-2">
            {profileName}
          </span>
        )}
        <Link
          href="/dashboard"
          className="flex h-10 items-center justify-center rounded-full border border-gray-200 bg-white px-6 text-[10px] font-bold uppercase tracking-widest text-gray-500 transition hover:bg-gray-50"
        >
          DASHBOARD
        </Link>
        <form action="/api/auth/logout" method="post">
          <button
            type="submit"
            className="flex h-10 items-center justify-center rounded-full border border-gray-200 bg-white px-6 text-[10px] font-bold uppercase tracking-widest text-gray-500 transition hover:bg-gray-50"
          >
            SIGN OUT
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <Link
        href="/sign-in"
        className="flex h-10 items-center justify-center rounded-full border border-gray-200 bg-white px-6 text-[10px] font-bold uppercase tracking-widest text-gray-500 transition hover:bg-gray-50"
      >
        SIGN IN
      </Link>
      <Link
        href="/sign-up"
        className="flex h-10 items-center justify-center rounded-full border border-gray-200 bg-white px-6 text-[10px] font-bold uppercase tracking-widest text-gray-500 transition hover:bg-gray-50"
      >
        SIGN UP
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
      className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-600 transition hover:bg-gray-50"
      aria-label="Contact support"
    >
      <Headphones className="h-4 w-4" />
    </a>
  );
}

export function LegacyFlowShell({
  signedIn,
  profileName,
  rightColumn,
}: {
  signedIn: boolean;
  profileName?: string;
  rightColumn: ReactNode;
}) {
  return (
    <main className="min-h-screen bg-[#f8f9fc] px-4 py-4 md:px-6 md:py-6 font-sans">
      <div className="mx-auto max-w-[1300px]">
        {/* ── Top Nav ── */}
        <div className="mb-4 flex items-center justify-between">
          <div className="rounded-full bg-white px-6 py-2.5 shadow-sm">
            <LogoLockup />
          </div>
          <div className="flex items-center gap-3">
            <SessionButton signedIn={signedIn} profileName={profileName} />
            <SupportButton />
          </div>
        </div>

        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:gap-8">
          {/* ── Left: Feature cards ── */}
          <section className="w-full lg:w-[420px] shrink-0 rounded-[2.5rem] bg-white p-5 shadow-sm md:p-6">
            <div className="mb-6 flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full border border-blue-50 bg-blue-50/50">
                <Sparkles className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h2 className="text-[1.5rem] font-black leading-tight text-gray-900 tracking-tight">
                  AI-Powered
                  <br />
                  Excellence
                </h2>
                <p className="mt-1 text-[9px] font-bold uppercase tracking-[0.2em] text-blue-600">
                  VIGILSIDDHI INTELLIGENCE
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {featureItems.map(({ icon: Icon, eyebrow, title, body }) => (
                <div
                  key={title}
                  className="rounded-3xl border border-gray-100 bg-white px-4 py-4 shadow-sm transition hover:shadow-md"
                >
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Icon className="h-4 w-4 text-gray-500" />
                      <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-gray-500">
                        {eyebrow}
                      </p>
                    </div>
                    <h3 className="text-[1.15rem] font-bold text-gray-900 tracking-tight">
                      {title}
                    </h3>
                    <p className="mt-1 text-sm leading-relaxed text-gray-500">
                      {body}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* ── Right: Entry card (sign-in/up form or builder) ── */}
          <div className="flex-1 w-full min-w-0">
            {rightColumn}
          </div>
        </div>
      </div>
    </main>
  );
}
