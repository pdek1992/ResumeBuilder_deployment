export const runtime = "nodejs";

import { ok, fail } from "@/lib/api-response";
import { generateAiContent } from "@/lib/ai/service";
import { assertCsrf } from "@/lib/security/csrf";
import { assertSafeOrigin } from "@/lib/security/request";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { assertRateLimit } from "@/lib/security/rate-limit";
import { getRequestMetadata } from "@/lib/security/request";

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
      max: 20,
      windowMinutes: 10,
    });

    const body = (await request.json()) as {
      mode: "RESUME_SECTION" | "RAW_TEXT" | "HTML" | "JSON";
      purpose: string;
      resumeId?: string;
      prompt: Record<string, unknown>;
    };

    const prompt = [
      `Purpose: ${body.purpose}`,
      "Return ONLY the requested output.",
      JSON.stringify(body.prompt),
    ].join("\n");

    const content = await generateAiContent({
      mode: body.mode,
      prompt,
      userId: user.id,
      metadata: {
        purpose: body.purpose,
        resumeId: body.resumeId,
      },
    });

    return ok({ content });
  } catch (error) {
    return fail(error, 400);
  }
}
