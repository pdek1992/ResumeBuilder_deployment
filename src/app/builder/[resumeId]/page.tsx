import { redirect } from "next/navigation";

import { requireUserProfile } from "@/lib/auth";
import { decompressJson } from "@/lib/compression";
import { getActiveResumePass, getAvailableMockInterviewPayment } from "@/lib/payments/access";
import { createDefaultResumeData } from "@/lib/resume/defaults";
import { getResumeForUser, listTemplates } from "@/lib/resume/repository";
import { ResumeEditor } from "@/components/editor/resume-editor";

export default async function ResumeEditorPage({ params }: { params: Promise<{ resumeId: string }> }) {
  const { resumeId } = await params;
  const profile = await requireUserProfile(`/builder/${encodeURIComponent(resumeId)}`);
  const [resume, templates, activePass, mockInterviewCredit] = await Promise.all([
    getResumeForUser(profile.id, resumeId),
    listTemplates(),
    getActiveResumePass(profile.id),
    getAvailableMockInterviewPayment(profile.id),
  ]);

  if (!resume) {
    redirect("/dashboard");
  }

  return (
    <ResumeEditor
      resumeId={resume.id}
      initialTitle={resume.title}
      initialData={decompressJson(resume.raw_json_compressed, createDefaultResumeData())}
      initialTemplateId={resume.template_id}
      initialIsLocked={resume.is_locked}
      templates={templates}
      profile={profile}
      hasActiveResumePass={Boolean(activePass)}
      hasMockInterviewCredit={Boolean(mockInterviewCredit)}
    />
  );
}
