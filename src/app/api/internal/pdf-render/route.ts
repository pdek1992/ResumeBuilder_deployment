export const runtime = "nodejs";
export const maxDuration = 60;

import { NextResponse } from "next/server";

import { env } from "@/lib/env";
import { resumeRecordToData } from "@/lib/pdf/export-data";
import { transitionPdfJob } from "@/lib/pdf/jobs";
import { newPdfPage } from "@/lib/pdf/pdf-engine";
import { verifyPdfRenderJob, type SignedPdfRenderJob } from "@/lib/pdf/signing";
import { generatePdfHtml } from "@/lib/pdf/html-renderer";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import type { ResumeRecord, TemplateRecord } from "@/lib/types";

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

function jsonError(message: string, status = 500) {
  return NextResponse.json({ status: "error", error: message }, { status });
}

async function withRetry<T>(operation: () => Promise<T>, retries = 1): Promise<T> {
  let lastError: unknown;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      if (attempt < retries) {
        await new Promise((resolve) => setTimeout(resolve, 250 * (attempt + 1)));
      }
    }
  }

  throw lastError;
}

async function loadResumeAndTemplate(job: SignedPdfRenderJob) {
  const supabase = getSupabaseAdminClient();
  const { data: resume, error: resumeError } = await supabase
    .from("resumes")
    .select("*")
    .eq("id", job.resumeId)
    .eq("user_id", job.userId)
    .maybeSingle();

  if (resumeError) throw resumeError;
  if (!resume) throw new Error("Resume not found");

  const { data: template, error: templateError } = await supabase
    .from("templates")
    .select("*")
    .eq("id", (resume as ResumeRecord).template_id)
    .maybeSingle();

  if (templateError) throw templateError;

  return {
    resumeData: resumeRecordToData(resume as ResumeRecord),
    template: (template as TemplateRecord | null) ?? {
      ...DEFAULT_TEMPLATE,
      id: (resume as ResumeRecord).template_id || DEFAULT_TEMPLATE.id,
    },
  };
}

async function generatePdfBuffer(job: SignedPdfRenderJob, assetBaseUrl: string) {
  const { resumeData, template } = await loadResumeAndTemplate(job);
  const html = await generatePdfHtml(resumeData, template, assetBaseUrl);
  const page = await newPdfPage();

  try {
    await page.setCacheEnabled(true);
    await page.setContent(html, {
      waitUntil: "domcontentloaded",
      timeout: env.pdfRendererTimeoutMs,
    });
    await page.waitForNetworkIdle({ idleTime: 100, timeout: env.pdfRendererTimeoutMs }).catch(() => undefined);
    await page.evaluateHandle("document.fonts.ready");

    return await page.pdf({
      format: "A4",
      printBackground: true,
      preferCSSPageSize: true,
      margin: {
        top: "0px",
        right: "0px",
        bottom: "0px",
        left: "0px",
      },
      timeout: env.pdfRendererTimeoutMs,
    });
  } finally {
    await page.close().catch(() => undefined);
  }
}

async function uploadPdf(job: SignedPdfRenderJob, pdfBuffer: Uint8Array) {
  const supabase = getSupabaseAdminClient();
  const storagePath = `pdf/${job.userId}/${job.resumeId}/${job.jobId}.pdf`;
  const { error: uploadError } = await supabase.storage.from("resumes").upload(storagePath, pdfBuffer, {
    contentType: "application/pdf",
    cacheControl: "3600",
    upsert: true,
  });

  if (uploadError) throw uploadError;

  const { data, error } = await supabase.storage
    .from("resumes")
    .createSignedUrl(storagePath, env.pdfSignedUrlTtlSeconds);

  if (error || !data?.signedUrl) {
    throw error ?? new Error("Failed to create signed PDF URL");
  }

  return data.signedUrl;
}

export async function POST(request: Request) {
  const job = (await request.json().catch(() => null)) as SignedPdfRenderJob | null;

  if (!job || !verifyPdfRenderJob(job)) {
    return jsonError("Unauthorized renderer request", 401);
  }

  const claimed = await transitionPdfJob({
    job,
    from: "pending",
    to: "processing",
  });

  if (!claimed) {
    return jsonError("Render job has already been used", 409);
  }

  try {
    const pdfBuffer = await withRetry(() => generatePdfBuffer(job, new URL(request.url).origin), 1);
    const signedUrl = await uploadPdf(job, pdfBuffer);

    await transitionPdfJob({
      job,
      to: "completed",
      pdfUrl: signedUrl,
    });

    return NextResponse.json({
      status: "success",
      url: signedUrl,
    });
  } catch (error) {
    await transitionPdfJob({
      job,
      to: "failed",
      errorMessage: error instanceof Error ? error.message : "PDF generation failed",
    }).catch(() => undefined);

    return jsonError(error instanceof Error ? error.message : "PDF generation failed");
  }
}
