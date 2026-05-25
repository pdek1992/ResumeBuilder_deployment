export const runtime = "nodejs";
export const maxDuration = 10;

import { NextResponse } from "next/server";

import { fail } from "@/lib/api-response";
import { verifyDownloadToken } from "@/lib/downloads/tokens";
import { logUserAction } from "@/lib/logging";
import { getActiveResumePass } from "@/lib/payments/access";
import { cleanupStalePdfJobs, createSignedPdfJob } from "@/lib/pdf/jobs";
import { requestPdfRender } from "@/lib/pdf/renderer-client";
import { getResumeForUser } from "@/lib/resume/repository";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");

    if (!token) return fail("Missing token", 400);

    const payload = await verifyDownloadToken(token);
    if (payload.format !== "pdf") return fail("Invalid download token", 400);

    const supabase = await getSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user || user.id !== payload.userId) {
      return fail("Authentication required", 401);
    }

    const pass = await getActiveResumePass(user.id, payload.resumeId);
    if (!pass) {
      return fail("Export access expired", 403);
    }

    const resume = await getResumeForUser(user.id, payload.resumeId);
    if (!resume) return fail("Resume not found", 404);

    await cleanupStalePdfJobs().catch(() => undefined);

    const job = await createSignedPdfJob({
      userId: user.id,
      resumeId: payload.resumeId,
    });
    const result = await requestPdfRender(job, new URL(request.url).origin);

    await logUserAction({
      userId: user.id,
      actionType: "pdf_download",
      metadata: { resumeId: payload.resumeId },
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("[PDF_DISPATCH] Internal renderer error:", error);
    return fail(error.message || "Failed to generate PDF", 500);
  }
}
