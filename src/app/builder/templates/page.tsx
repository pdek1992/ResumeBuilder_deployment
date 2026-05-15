import Link from "next/link";
import { redirect } from "next/navigation";

import { requireUserProfile } from "@/lib/auth";
import { getResumeForUser, listTemplates } from "@/lib/resume/repository";
import { TemplateSelector } from "@/components/builder/template-selector";
import { LogoLockup } from "@/components/ui/logo-lockup";
import { LegacyFlowShell } from "@/components/marketing/legacy-shell";

export default async function TemplatePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const resumeId = typeof params.resumeId === "string" ? params.resumeId : "";
  const nextPath = resumeId ? `/builder/templates?resumeId=${encodeURIComponent(resumeId)}` : "/builder/templates";
  const profile = await requireUserProfile(nextPath);

  if (!resumeId) {
    redirect("/dashboard");
  }

  const [resume, templates] = await Promise.all([getResumeForUser(profile.id, resumeId), listTemplates()]);

  if (!resume) {
    redirect("/dashboard");
  }

  return (
    <main className="min-h-screen bg-[#f8f9fc] p-6 md:p-12">
      <div className="mx-auto max-w-[1440px]">
        <div className="mb-12 flex items-center justify-between">
          <LogoLockup />
          <Link
            href={`/builder/${resumeId}`}
            className="rounded-full border border-slate-200 bg-white px-6 py-3 text-[11px] font-black uppercase tracking-[0.2em] text-slate-500 transition hover:bg-slate-50"
          >
            Back to Editor
          </Link>
        </div>
        <TemplateSelector 
          resumeId={resumeId} 
          templates={templates} 
          selectedTemplateId={resume.template_id} 
        />
      </div>
    </main>
  );
}
