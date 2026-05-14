export const runtime = "nodejs";

import { ok, fail } from "@/lib/api-response";
import { assertCsrf } from "@/lib/security/csrf";
import { assertSafeOrigin } from "@/lib/security/request";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { logUserAction } from "@/lib/logging";

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
      geminiApiKey?: string;
      openAiApiKey?: string;
    };

    const aiConfig: Record<string, string> = {};
    if (body.geminiApiKey) aiConfig.geminiApiKey = body.geminiApiKey;
    if (body.openAiApiKey) aiConfig.openAiApiKey = body.openAiApiKey;

    const admin = getSupabaseAdminClient();
    const { error } = await admin
      .from("users")
      .update({ ai_config: aiConfig })
      .eq("id", user.id);

    if (error) {
      throw error;
    }

    await logUserAction({
      userId: user.id,
      actionType: "ai_generation", // Reusing this for AI setting changes or create a new one
      metadata: {
        action: "update_ai_config",
      },
    });

    return ok({ success: true });
  } catch (error) {
    return fail(error, 400);
  }
}
