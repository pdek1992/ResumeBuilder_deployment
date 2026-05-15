import Link from "next/link";

import { requireUserProfile } from "@/lib/auth";
import { listUserResumes } from "@/lib/resume/repository";
import { LegacyFlowShell } from "@/components/marketing/legacy-shell";

export default async function DashboardPage() {
  const profile = await requireUserProfile("/dashboard");
  const resumes = await listUserResumes(profile.id);

  return (
    <LegacyFlowShell
      signedIn
      profileName={profile.first_name || profile.username}
      rightColumn={
        <section className="rounded-[3rem] border border-white/70 bg-white/82 px-6 py-8 shadow-[0_30px_80px_rgba(37,99,235,0.12)] backdrop-blur md:px-10 md:py-10">
          <p className="text-[12px] font-black uppercase tracking-[0.32em] text-primary">Workspace</p>
          <h1 className="mt-6 font-display text-[3.15rem] font-black leading-[0.92] tracking-tight text-slate-950 md:text-[4.8rem]">
            {profile.first_name},
            <br />
            your drafts are
            <br />
            <span className="text-primary">ready</span>
          </h1>
          <p className="mt-8 max-w-2xl text-[18px] leading-10 text-slate-500 md:text-[1.45rem] md:leading-[2.8rem]">
            Your identity stays locked to one person across all resumes. Drafts restore automatically after login.
          </p>

          <div className="mt-10 flex flex-wrap gap-3">
            <Link
              href="/builder/import"
              className="rounded-full bg-primary px-7 py-4 text-[12px] font-black uppercase tracking-[0.24em] text-white shadow-[0_18px_40px_rgba(48,103,234,0.22)]"
            >
              New Resume
            </Link>
            <Link
              href="/settings"
              className="rounded-full border border-slate-200 bg-white px-7 py-4 text-[12px] font-black uppercase tracking-[0.24em] text-slate-600 shadow-[0_12px_30px_rgba(15,23,42,0.05)]"
            >
              Settings
            </Link>
          </div>

          <div className="mt-10 space-y-5">
            {resumes.length === 0 ? (
              <div className="rounded-[2.4rem] border border-slate-100 bg-white px-6 py-7 shadow-[0_14px_40px_rgba(15,23,42,0.04)]">
                <p className="text-[1.7rem] font-black tracking-tight text-slate-950">No resumes yet</p>
                <p className="mt-3 text-[15px] leading-8 text-slate-500">
                  Start with import or manual build and the system will autosave every change.
                </p>
                <Link
                  href="/builder/import"
                  className="mt-6 inline-flex rounded-full bg-slate-950 px-6 py-3 text-[12px] font-black uppercase tracking-[0.24em] text-white"
                >
                  Create Your First Resume
                </Link>
              </div>
            ) : (
              resumes.map((resume) => (
                <div
                  key={resume.id}
                  className="rounded-[2.4rem] border border-slate-100 bg-white px-6 py-7 shadow-[0_14px_40px_rgba(15,23,42,0.04)]"
                >
                  <p className="text-[11px] font-black uppercase tracking-[0.26em] text-slate-400">{resume.template_id}</p>
                  <h2 className="mt-3 text-[1.9rem] font-black tracking-tight text-slate-950">{resume.title}</h2>
                  <p className="mt-3 text-[14px] leading-7 text-slate-500">Updated {new Date(resume.updated_at).toLocaleString()}</p>
                  <div className="mt-6 flex flex-wrap gap-3">
                    <Link
                      href={`/builder/${resume.id}`}
                      className="rounded-full bg-primary px-6 py-3 text-[12px] font-black uppercase tracking-[0.24em] text-white"
                    >
                      Edit Resume
                    </Link>
                    <Link
                      href={`/builder/templates?resumeId=${resume.id}`}
                      className="rounded-full border border-slate-200 bg-white px-6 py-3 text-[12px] font-black uppercase tracking-[0.24em] text-slate-600"
                    >
                      Switch Style
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      }
    />
  );
}
