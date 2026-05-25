export const runtime = "nodejs";
export const maxDuration = 10;

import { NextResponse } from "next/server";

import { env } from "@/lib/env";
import { transitionPdfJob } from "@/lib/pdf/jobs";
import { newPdfPage } from "@/lib/pdf/pdf-engine";
import { verifyPdfRenderJob, type SignedPdfRenderJob } from "@/lib/pdf/signing";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";



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

async function generatePdfBuffer(job: SignedPdfRenderJob, assetBaseUrl: string) {
  const page = await newPdfPage();

  try {
    await page.setCacheEnabled(true);
    
    // Build the secure print URL using the jobId
    const url = new URL(`/print/${job.jobId}`, assetBaseUrl).toString();

    // Navigate to the print view
    await page.goto(url, {
      waitUntil: "networkidle0",
      timeout: env.pdfRendererTimeoutMs,
    });
    
    // Wait for the fonts and images to be fully loaded
    await page.waitForSelector("#pdf-ready", {
      timeout: env.pdfRendererTimeoutMs,
    }).catch(() => {
      console.warn("[PDF_RENDER] #pdf-ready selector timeout. Proceeding with render anyway.");
    });

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
