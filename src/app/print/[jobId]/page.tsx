import { notFound } from "next/navigation";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { resumeRecordToData } from "@/lib/pdf/export-data";
import type { ResumeRecord, TemplateRecord } from "@/lib/types";
import { ResumePreview } from "@/components/builder/resume-preview";
import { hydrateTemplateRecord } from "@/lib/resume/templates";
import { PdfReadyNotifier } from "./notifier";

const DEFAULT_TEMPLATE: TemplateRecord = {
  id: "default",
  template_name: "Default Template",
  preview_image: "",
  description: "",
  tags: [],
  active: true,
  config_json: {
    accent: "#2563eb",
    headerBackground: "#ffffff",
    pageBackground: "#ffffff",
    density: "balanced",
    typography: "modern-sans",
    columns: "single",
    layout: "standard",
  },
};

export default async function PrintPage({ params }: { params: Promise<{ jobId: string }> }) {
  const { jobId } = await params;
  const supabase = getSupabaseAdminClient();
  
  const { data: job, error: jobError } = await supabase
    .from("pdf_generation_jobs")
    .select("*")
    .eq("id", jobId)
    .maybeSingle();

  if (!job || jobError) {
    return notFound();
  }

  const { data: resume, error: resumeError } = await supabase
    .from("resumes")
    .select("*")
    .eq("id", job.resume_id)
    .eq("user_id", job.user_id)
    .maybeSingle();

  if (!resume || resumeError) {
    return notFound();
  }

  const { data: template } = await supabase
    .from("templates")
    .select("*")
    .eq("id", resume.template_id)
    .maybeSingle();

  const resumeData = resumeRecordToData(resume as ResumeRecord);
  const activeTemplate = template 
    ? hydrateTemplateRecord(template as TemplateRecord)
    : {
        ...DEFAULT_TEMPLATE,
        id: resume.template_id || DEFAULT_TEMPLATE.id,
      };

  return (
    <div className="bg-white min-h-screen">
      <style dangerouslySetInnerHTML={{ __html: `
        @page { size: A4; margin: 0; }
        html, body { height: auto !important; overflow: visible !important; }
        body { margin: 0; padding: 0; background: #ffffff; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
        [data-pdf-page="true"] { height: auto !important; overflow: visible !important; }
        [data-pdf-page="true"] * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
        [data-pdf-page="true"] p, [data-pdf-page="true"] li { overflow-wrap: anywhere; }
        [data-pdf-page="true"] [class*="break-inside-avoid"] { break-inside: avoid-page; page-break-inside: avoid; }
      `}} />
      <ResumePreview resume={resumeData} template={activeTemplate} isPrintMode={true} />
      <PdfReadyNotifier />
    </div>
  );
}
