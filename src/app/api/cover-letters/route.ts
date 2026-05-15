export const runtime = "nodejs";

import { ok, fail } from "@/lib/api-response";
import { generateAiContent } from "@/lib/ai/service";
import { getResumeForUser } from "@/lib/resume/repository";
import { decompressJson } from "@/lib/compression";
import { createDefaultResumeData } from "@/lib/resume/defaults";
import { hasCoverLetterAccess } from "@/lib/payments/access";
import { assertCsrf } from "@/lib/security/csrf";
import { assertSafeOrigin } from "@/lib/security/request";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { logUserAction } from "@/lib/logging";
import { sendTelegramAlert } from "@/lib/telegram";

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

    const hasAccess = await hasCoverLetterAccess(user.id);
    if (!hasAccess) {
      return fail("Active pass required for cover letter generation", 403);
    }

    const body = (await request.json()) as {
      resumeId: string;
      companyName: string;
      jd: string;
    };

    const resume = await getResumeForUser(user.id, body.resumeId);

    if (!resume) {
      return fail("Resume not found", 404);
    }

    const parsedResume = decompressJson(resume.raw_json_compressed, createDefaultResumeData());
    const content = await generateAiContent({
      mode: "COVER_LETTER",
      userId: user.id,
      metadata: {
        purpose: "cover_letter",
        resumeId: body.resumeId,
      },
      prompt: [
        "Generate a direct final cover letter only.",
        JSON.stringify({
          companyName: body.companyName,
          jobDescription: body.jd,
          resume: parsedResume,
        }),
      ].join("\n"),
    });

    await getSupabaseAdminClient().from("cover_letters").insert({
      user_id: user.id,
      resume_id: body.resumeId,
      company_name: body.companyName,
      jd: body.jd,
      generated_text: content,
    });

    await logUserAction({
      userId: user.id,
      actionType: "cover_letter_generate",
      metadata: {
        resumeId: body.resumeId,
      },
    });

    await sendTelegramAlert(`📝 *Cover Letter Generated*\nUser: \`${user.email || user.id}\`\nCompany: \`${body.companyName}\`\nResume: \`${body.resumeId}\``);

    return ok({ content });
  } catch (error) {
    return fail(error, 400);
  }
}

