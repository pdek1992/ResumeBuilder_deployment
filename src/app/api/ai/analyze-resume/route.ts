export const runtime = "nodejs";

import { ok, fail } from "@/lib/api-response";
import { generateAiContent } from "@/lib/ai/service";
import { assertCsrf } from "@/lib/security/csrf";
import { assertSafeOrigin } from "@/lib/security/request";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { assertRateLimit } from "@/lib/security/rate-limit";
import { getRequestMetadata } from "@/lib/security/request";
import { RESUME_ANALYSIS_PROMPT } from "@/lib/ai/prompts";

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

    const metadata = await getRequestMetadata();
    await assertRateLimit({
      actionType: "ai_generation",
      userId: user.id,
      ipAddress: metadata.ipAddress,
      max: 10,
      windowMinutes: 60,
    });

    const body = (await request.json()) as {
      resumeData: any;
    };

    if (!body.resumeData) {
      return fail("No resume data provided", 400);
    }

    const prompt = `${RESUME_ANALYSIS_PROMPT}\n\nResume Data to Analyze:\n${JSON.stringify(body.resumeData, null, 2)}`;

    const rawJsonString = await generateAiContent({
      mode: "JSON",
      prompt,
      userId: user.id,
      metadata: {
        purpose: "analyze_resume",
      },
    });

    let analysis;
    try {
      analysis = JSON.parse(rawJsonString);
    } catch (e) {
      return fail("AI failed to return valid JSON", 500);
    }

    return ok({ data: analysis });
  } catch (error) {
    return fail(error, 400);
  }
}
