import { ok, fail } from "@/lib/api-response";
import { absoluteUrl } from "@/lib/utils";
import { createDownloadToken } from "@/lib/downloads/tokens";
import { getActiveResumePass } from "@/lib/payments/access";
import { assertCsrf } from "@/lib/security/csrf";
import { assertSafeOrigin } from "@/lib/security/request";
import { getSupabaseServerClient } from "@/lib/supabase/server";
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

    const userName = user.user_metadata?.full_name || user.user_metadata?.name || user.email || user.id;
    const { ip, location } = await getIpAndLocation(request);
    await sendTelegramUserActionAlert({
      action: "Export Initiated",
      username: String(userName),
      mobile: String(user.user_metadata?.mobile || "Not provided"),
      ipAddress: ip,
      location,
      timestamp: new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }) + " (IST)",
      details: `Format: \`${body.format.toUpperCase()}\` | Resume ID: \`${body.resumeId}\``,
    });

    return ok({
      url: absoluteUrl(`/api/downloads/${body.format}?token=${encodeURIComponent(token)}`),
    });
  } catch (error) {
    return fail(error, 400);
  }
}

