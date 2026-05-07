import { ok, fail } from "@/lib/api-response";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { assertCsrf } from "@/lib/security/csrf";
import { assertSafeOrigin } from "@/lib/security/request";
import { logUserAction } from "@/lib/logging";
import type { AccessActionType } from "@/lib/types";

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
      actionType: AccessActionType;
      metadata?: Record<string, unknown>;
    };

    await logUserAction({
      userId: user.id,
      actionType: body.actionType,
      metadata: body.metadata,
    });

    return ok({ success: true });
  } catch (error) {
    return fail(error, 400);
  }
}
