import { ok, fail } from "@/lib/api-response";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { assertCsrf } from "@/lib/security/csrf";
import { assertSafeOrigin } from "@/lib/security/request";
import { duplicateResume } from "@/lib/resume/repository";

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
    };

    if (!body.resumeId) {
      return fail("Resume ID is required", 400);
    }

    const resume = await duplicateResume(user.id, body.resumeId);

    return ok({ resume });
  } catch (error) {
    return fail(error, 400);
  }
}
