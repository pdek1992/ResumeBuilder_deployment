import { ok, fail } from "@/lib/api-response";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { assertCsrf } from "@/lib/security/csrf";
import { assertSafeOrigin } from "@/lib/security/request";
import { createDefaultResumeData } from "@/lib/resume/defaults";
import { getResumeForUser, saveResumeDraft } from "@/lib/resume/repository";
import { decompressJson } from "@/lib/compression";
import type { ResumeData } from "@/lib/types";
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

    const body = (await request.json()) as {
      resumeId: string;
      templateId?: string;
      title?: string;
      data?: ResumeData;
      currentDraftState?: Record<string, unknown>;
    };

    const existing = await getResumeForUser(user.id, body.resumeId);

    if (!existing) {
      return fail("Resume not found", 404);
    }

    const payload = body.data ?? decompressJson(existing.raw_json_compressed, createDefaultResumeData());
    const updated = await saveResumeDraft({
      resumeId: body.resumeId,
      userId: user.id,
      templateId: body.templateId,
      title: body.title,
      data: payload,
      currentDraftState: body.currentDraftState,
    });

    await logUserAction({
      userId: user.id,
      actionType: body.templateId && body.templateId !== existing.template_id ? "template_change" : "resume_edit",
      metadata: {
        resumeId: body.resumeId,
        templateId: body.templateId ?? existing.template_id,
      },
    });

    if (body.templateId && body.templateId !== existing.template_id) {
      await sendTelegramAlert(`🔄 *User Template Swapped*\nUser: \`${user.email || user.id}\`\nNew Template: \`${body.templateId}\``);
    }

    return ok({ resume: updated });
  } catch (error) {
    return fail(error, 400);
  }
}

