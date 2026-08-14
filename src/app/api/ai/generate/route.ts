export const runtime = "nodejs";

import { ok, fail } from "@/lib/api-response";
import { generateAiContent } from "@/lib/ai/service";
import { RESUME_SECTION_SYSTEM_PROMPT } from "@/lib/ai/prompts";
import { assertCsrf } from "@/lib/security/csrf";
import { assertSafeOrigin } from "@/lib/security/request";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { assertRateLimit } from "@/lib/security/rate-limit";
import { getRequestMetadata } from "@/lib/security/request";
import { sendTelegramUserActionAlert, getIpAndLocation } from "@/lib/telegram";

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
      systemPrompt: body.mode === "RESUME_SECTION" ? RESUME_SECTION_SYSTEM_PROMPT : undefined,
      metadata: {
        purpose: body.purpose,
        resumeId: body.resumeId,
      },
    });

    const userName = user.user_metadata?.full_name || user.user_metadata?.name || user.email || user.id;
    const { ip, location } = await getIpAndLocation(request);
    await sendTelegramUserActionAlert({
      action: "AI Content Generated",
      username: String(userName),
      mobile: String(user.user_metadata?.mobile || "Not provided"),
      ipAddress: ip,
      location,
      timestamp: new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }) + " (IST)",
      details: `Purpose: \`${body.purpose}\` | Mode: \`${body.mode}\` | Resume ID: \`${body.resumeId ?? "N/A"}\``,
    });

    return ok({ content });
  } catch (error) {
    return fail(error, 400);
  }
}
