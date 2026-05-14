import Link from "next/link";
import { redirect } from "next/navigation";

import { requireUserProfile } from "@/lib/auth";
import { getResumeForUser, listTemplates } from "@/lib/resume/repository";
import { TemplateSelector } from "@/components/builder/template-selector";
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

  return <LegacyFlowShell signedIn rightColumn={<TemplateSelector resumeId={resumeId} templates={templates} selectedTemplateId={resume.template_id} />} />;
}
