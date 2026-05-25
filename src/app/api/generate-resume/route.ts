export const runtime = "nodejs";
export const maxDuration = 10;

import { NextResponse } from "next/server";
import crypto from "crypto";

import { ok, fail } from "@/lib/api-response";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getActiveResumePass } from "@/lib/payments/access";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

// Create HMAC signature matching the renderer script
function generateHmacSignature(jobId: string, resumeId: string, timestamp: string, nonce: string, secret: string): string {
  const data = jobId + resumeId + timestamp + nonce;
  return crypto.createHmac("sha256", secret).update(data).digest("hex");
}

/**
 * GET: Polls the PDF generation status
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get("jobId");

    if (!jobId) {
      return fail("Missing jobId parameter", 400);
    }

    const supabase = await getSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return fail("Authentication required", 401);
    }

    // Query job status using standard user client (RLS applies)
    const { data: job, error } = await supabase
      .from("pdf_generation_jobs")
      .select("*")
      .eq("id", jobId)
      .single();

    if (error || !job) {
      return fail("Generation job not found", 404);
    }

    if (job.user_id !== user.id) {
      return fail("Unauthorized access to job", 403);
    }

    return ok({
      jobId: job.id,
      status: job.status, // 'pending' | 'processing' | 'completed' | 'failed'
      url: job.pdf_url,
      error: job.error_message,
    });
  } catch (error) {
    return fail(error, 400);
  }
}

/**
 * POST: Initiates a PDF generation workflow via GHA
 */
export async function POST(request: Request) {
  try {
    const supabase = await getSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return fail("Authentication required", 401);
    }

    const { resumeId } = (await request.json()) as { resumeId: string };
    if (!resumeId) {
      return fail("Missing resumeId", 400);
    }

    // Validate active export pass
    const pass = await getActiveResumePass(user.id);
    if (!pass) {
      return fail("An active export pass is required to export", 403);
    }

    // Fetch environment keys for GitHub trigger
    const renderSecret = process.env.RENDER_SECRET;
    const githubToken = process.env.GITHUB_TOKEN;
    const githubRepo = process.env.GITHUB_REPO; // format: owner/repo
    const githubBranch = process.env.GITHUB_BRANCH || "main";

    if (!renderSecret) {
      console.error("[PDF_PIPELINE] Missing RENDER_SECRET in environment.");
      return fail("Internal server configuration error", 500);
    }
    if (!githubToken || !githubRepo) {
      console.error("[PDF_PIPELINE] Missing GITHUB_TOKEN or GITHUB_REPO in environment.");
      return fail("Compute backend configuration error", 500);
    }

    // 1. Generate security tokens & HMAC signature
    const jobId = crypto.randomUUID();
    const nonce = crypto.randomBytes(16).toString("hex");
    const timestamp = new Date().toISOString();
    const signature = generateHmacSignature(jobId, resumeId, timestamp, nonce, renderSecret);

    // 2. Insert record in jobs table (using admin client to bypass user RLS write blocks if needed)
    const adminSupabase = getSupabaseAdminClient();
    const { error: insertError } = await adminSupabase.from("pdf_generation_jobs").insert({
      id: jobId,
      user_id: user.id,
      resume_id: resumeId,
      status: "pending",
      signature,
      nonce,
      timestamp,
    });

    if (insertError) {
      console.error("[PDF_PIPELINE] Failed to register job record:", insertError);
      return fail("Failed to initialize rendering job", 500);
    }

    // 3. Dispatch GitHub Actions workflow
    const [owner, repo] = githubRepo.split("/");
    if (!owner || !repo) {
      return fail("Invalid GITHUB_REPO format. Must be 'owner/repo'", 500);
    }

    console.log(`[PDF_PIPELINE] Dispatching GHA workflow for jobId: ${jobId}`);
    const dispatchUrl = `https://api.github.com/repos/${owner}/${repo}/actions/workflows/render-pdf.yml/dispatches`;
    
    const githubResponse = await fetch(dispatchUrl, {
      method: "POST",
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${githubToken}`,
        "X-GitHub-Api-Version": "2022-11-28",
        "Content-Type": "application/json",
        "User-Agent": "Vercel-Resume-Builder",
      },
      body: JSON.stringify({
        ref: githubBranch,
        inputs: {
          jobId,
          resumeId,
          timestamp,
          nonce,
          signature,
        },
      }),
    });

    if (!githubResponse.ok) {
      const errorText = await githubResponse.text();
      console.error(`[PDF_PIPELINE] GitHub trigger failed. Status: ${githubResponse.status}, Error: ${errorText}`);
      
      // Update job to failed in database
      await adminSupabase
        .from("pdf_generation_jobs")
        .update({ status: "failed", error_message: `GHA Dispatch error: ${githubResponse.statusText}` })
        .eq("id", jobId);

      return fail("Failed to trigger rendering backend", 502);
    }

    return ok({
      jobId,
      status: "pending",
    });
  } catch (error) {
    console.error("[PDF_PIPELINE] Server error in route:", error);
    return fail(error, 500);
  }
}
