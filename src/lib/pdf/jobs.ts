import { env } from "@/lib/env";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { createPdfRenderJobPayload, signPdfRenderJob, type SignedPdfRenderJob } from "@/lib/pdf/signing";

type PdfJobStatus = "pending" | "processing" | "completed" | "failed";

export async function createSignedPdfJob({
  userId,
  resumeId,
}: {
  userId: string;
  resumeId: string;
}) {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("pdf_generation_jobs")
    .insert({
      user_id: userId,
      resume_id: resumeId,
      status: "pending",
      signature: "pending",
      nonce: "pending",
      timestamp: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (error) {
    throw error;
  }

  const payload = createPdfRenderJobPayload({
    jobId: data?.id ?? randomUUID(),
    userId,
    resumeId,
  });
  const signedJob = signPdfRenderJob(payload);

  if (data?.id) {
    const update = await supabase
      .from("pdf_generation_jobs")
      .update({
        signature: signedJob.signature,
        nonce: signedJob.nonce,
        timestamp: new Date(signedJob.timestamp).toISOString(),
      })
      .eq("id", data.id);

    if (update.error) {
      throw update.error;
    }
  }

  return signedJob;
}

export async function transitionPdfJob({
  job,
  from,
  to,
  errorMessage,
  pdfUrl,
}: {
  job: SignedPdfRenderJob;
  from?: PdfJobStatus;
  to: PdfJobStatus;
  errorMessage?: string;
  pdfUrl?: string;
}) {
  const supabase = getSupabaseAdminClient();
  let query = supabase
    .from("pdf_generation_jobs")
    .update({
      status: to,
      error_message: errorMessage ?? null,
      pdf_url: pdfUrl ?? null,
    })
    .eq("id", job.jobId)
    .eq("user_id", job.userId)
    .eq("resume_id", job.resumeId)
    .eq("nonce", job.nonce)
    .eq("signature", job.signature);

  if (from) {
    query = query.eq("status", from);
  }

  const { data, error } = await query.select("id").maybeSingle();

  if (error) {
    throw error;
  }

  return Boolean(data);
}

export async function cleanupStalePdfJobs() {
  const supabase = getSupabaseAdminClient();
  const cutoff = new Date(Date.now() - env.pdfRendererTimeoutMs * 2).toISOString();

  const { error } = await supabase
    .from("pdf_generation_jobs")
    .update({
      status: "failed",
      error_message: "Generation timed out",
    })
    .in("status", ["pending", "processing"])
    .lt("updated_at", cutoff);

  if (error) {
    throw error;
  }
}
import { randomUUID } from "node:crypto";
