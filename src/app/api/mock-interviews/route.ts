export const runtime = "nodejs";

import { z } from "zod";

import { ok, fail } from "@/lib/api-response";
import { generateAiContent } from "@/lib/ai/service";
import { getResumeForUser } from "@/lib/resume/repository";
import { decompressJson } from "@/lib/compression";
import { createDefaultResumeData } from "@/lib/resume/defaults";
import { consumeMockInterviewPayment } from "@/lib/payments/access";
import { assertCsrf } from "@/lib/security/csrf";
import { assertSafeOrigin } from "@/lib/security/request";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { logUserAction } from "@/lib/logging";

const interviewSchema = z.object({
  items: z.array(
    z.object({
      question: z.string(),
      answer: z.string(),
      tone_guidance: z.string(),
    }),
  ),
});

export async function POST(request: Request) {
  try {
    await assertSafeOrigin();
    await assertCsrf();

    const supabase = await getSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return fail("Authentication required", 401);
    }

    const payment = await consumeMockInterviewPayment(user.id);

    if (!payment) {
      return fail("A dedicated mock interview payment is required", 402);
    }

    const body = (await request.json()) as {
      resumeId: string;
      companyName: string;
      jd: string;
      experience: string;
    };

    const resume = await getResumeForUser(user.id, body.resumeId);

    if (!resume) {
      return fail("Resume not found", 404);
    }

    const parsedResume = decompressJson(resume.raw_json_compressed, createDefaultResumeData());
    const content = await generateAiContent({
      mode: "JSON",
      userId: user.id,
      metadata: {
        purpose: "mock_interview",
        resumeId: body.resumeId,
      },
      prompt: [
        "Return ONLY valid JSON in this shape:",
        '{"items":[{"question":"","answer":"","tone_guidance":""}]}',
        "Generate exactly 20 interview items tailored to the company, JD, resume, and experience.",
        JSON.stringify({
          companyName: body.companyName,
          jd: body.jd,
          experience: body.experience,
          resume: parsedResume,
        }),
      ].join("\n"),
    });

    const parsed = interviewSchema.parse(JSON.parse(content));

    await getSupabaseAdminClient().from("mock_interviews").insert({
      user_id: user.id,
      resume_id: body.resumeId,
      company_name: body.companyName,
      jd: body.jd,
      qa_data: parsed.items,
      payment_id: payment.id,
    });

    await logUserAction({
      userId: user.id,
      actionType: "mock_interview_generate",
      metadata: {
        resumeId: body.resumeId,
      },
    });

    return ok(parsed);
  } catch (error) {
    return fail(error, 400);
  }
}
