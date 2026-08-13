export const runtime = "nodejs";

import { z } from "zod";

import { ok, fail } from "@/lib/api-response";
import { generateAiContent } from "@/lib/ai/service";
import { getResumeForUser } from "@/lib/resume/repository";
import { decompressJson } from "@/lib/compression";
import { createDefaultResumeData } from "@/lib/resume/defaults";
import { hasInterviewGuideAccess } from "@/lib/payments/access";
import { assertCsrf } from "@/lib/security/csrf";
import { assertSafeOrigin } from "@/lib/security/request";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { logUserAction } from "@/lib/logging";

const interviewGuideSchema = z.object({
  items: z.array(
    z.object({
      category: z.string(),
      questions: z.array(z.string()),
    })
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

    const hasAccess = await hasInterviewGuideAccess(user.id);

    if (!hasAccess) {
      return fail("An active interview guide pass is required", 403);
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
        purpose: "interview_guide",
        resumeId: body.resumeId,
      },
      prompt: [
        "Return ONLY valid JSON in this shape:",
        '{"items":[{"category":"","questions":["",""]}]}',
        "Generate exactly 5 categories of interview questions tailored to the company, JD, resume, and experience. Each category should have exactly 4 questions. DO NOT GENERATE ANSWERS. Just the questions.",
        JSON.stringify({
          companyName: body.companyName,
          jd: body.jd,
          experience: body.experience,
          resume: parsedResume,
        }),
      ].join("\n"),
    });

    const parsed = interviewGuideSchema.parse(JSON.parse(content));

    await logUserAction({
      userId: user.id,
      actionType: "interview_guide_generate",
      metadata: {
        resumeId: body.resumeId,
      },
    });

    return ok(parsed);
  } catch (error) {
    return fail(error, 400);
  }
}
