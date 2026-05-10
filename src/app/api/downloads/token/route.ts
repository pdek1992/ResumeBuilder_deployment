import { ok, fail } from "@/lib/api-response";
import { absoluteUrl } from "@/lib/utils";
import { createDownloadToken } from "@/lib/downloads/tokens";
import { getActiveResumePass } from "@/lib/payments/access";
import { assertCsrf } from "@/lib/security/csrf";
import { assertSafeOrigin } from "@/lib/security/request";
import { getSupabaseServerClient } from "@/lib/supabase/server";
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

    const body = (await request.json()) as { resumeId: string; format: "pdf" | "docx" };
    const pass = await getActiveResumePass(user.id);

    if (!pass) {
      return fail("An active export pass is required", 403);
    }

    const token = await createDownloadToken({
      userId: user.id,
      resumeId: body.resumeId,
      format: body.format,
    });

    await sendTelegramAlert(`📥 *Export Initiated*\nUser: \`${user.id}\`\nFormat: \`${body.format.toUpperCase()}\`\nResume: \`${body.resumeId}\``);

    return ok({
      url: absoluteUrl(`/api/downloads/${body.format}?token=${encodeURIComponent(token)}`),
    });
  } catch (error) {
    return fail(error, 400);
  }
}
